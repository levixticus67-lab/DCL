import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { requireMainAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({ user: req.isAuthenticated() ? req.user : null });
});

router.get("/auth/users", requireMainAdmin, async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

const PromoteBody = z.object({
  role: z.enum([
    "main_admin",
    "pastor",
    "minister",
    "finance_head",
    "branch_head",
    "leader",
    "member",
    "guest",
  ]),
});

router.patch(
  "/auth/users/:id/role",
  requireMainAdmin,
  async (req, res) => {
    const { role } = PromoteBody.parse(req.body);
    const [updated] = await db
      .update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: updated.id, email: updated.email, role: updated.role });
  },
);

export default router;
