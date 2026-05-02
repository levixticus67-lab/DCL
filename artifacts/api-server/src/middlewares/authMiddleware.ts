import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable, peopleTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { getFirebaseAuth } from "../lib/firebase-admin";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers["authorization"];
  if (!header || typeof header !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

async function upsertUserFromClaims(claims: {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}): Promise<AuthUser> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);
  const isFirstUser = count === 0;

  const baseData = {
    id: claims.uid,
    email: claims.email,
    firstName: claims.firstName,
    lastName: claims.lastName,
    profileImageUrl: claims.profileImageUrl,
  };

  const insertData = {
    ...baseData,
    role: isFirstUser ? "main_admin" : "member",
  };

  const [user] = await db
    .insert(usersTable)
    .values(insertData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...baseData,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role as "main_admin" | "leader" | "member" | "guest",
  };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const token = getBearerToken(req);
  if (!token) {
    next();
    return;
  }

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(token);
  } catch (err) {
    req.log?.warn({ err }, "Firebase ID token verification failed");
    res.status(401).json({
      error: "Invalid auth token",
      detail: (err as Error).message,
    });
    return;
  }

  const splitName = (
    full: string | undefined,
  ): [string | null, string | null] => {
    if (!full) return [null, null];
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return [parts[0], null];
    return [parts[0], parts.slice(1).join(" ")];
  };

  const [first, last] = splitName(decoded.name as string | undefined);

  try {
    const user = await upsertUserFromClaims({
      uid: decoded.uid,
      email: (decoded.email as string | undefined) ?? null,
      firstName: first,
      lastName: last,
      profileImageUrl: (decoded.picture as string | undefined) ?? null,
    });

    // Always reflect the latest role from DB (in case it was elevated/changed)
    const [fresh] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    // Auto role detection: if this user is still a plain member but their
    // email matches a person record with a specific role, promote them
    // automatically so they land in the right dashboard on login.
    if (fresh.role === "member" && fresh.email) {
      const [matchedPerson] = await db
        .select()
        .from(peopleTable)
        .where(eq(peopleTable.email, fresh.email));

      const promotableRoles = [
        "pastor",
        "minister",
        "finance_head",
        "branch_head",
        "leader",
      ];
      if (
        matchedPerson?.role &&
        promotableRoles.includes(matchedPerson.role)
      ) {
        const [promoted] = await db
          .update(usersTable)
          .set({ role: matchedPerson.role, updatedAt: new Date() })
          .where(eq(usersTable.id, fresh.id))
          .returning();

        req.user = {
          id: promoted.id,
          email: promoted.email,
          firstName: promoted.firstName,
          lastName: promoted.lastName,
          profileImageUrl: promoted.profileImageUrl,
          role: promoted.role as "main_admin" | "leader" | "member" | "guest",
        };
        next();
        return;
      }
    }

    req.user = {
      id: fresh.id,
      email: fresh.email,
      firstName: fresh.firstName,
      lastName: fresh.lastName,
      profileImageUrl: fresh.profileImageUrl,
      role: fresh.role as "main_admin" | "leader" | "member" | "guest",
    };
  } catch (err) {
    req.log?.error({ err }, "Failed to upsert user from Firebase claims");
    res.status(500).json({
      error: "Auth backend failure — could not persist user",
      detail: (err as Error).message,
    });
    return;
  }

  next();
}
