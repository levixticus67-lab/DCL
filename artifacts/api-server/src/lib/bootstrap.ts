import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Transient errors that mean "the database isn't reachable yet, but might be
 * in a few seconds". Common on a brand-new Render Blueprint deploy where the
 * web service comes online before Render's internal DNS has registered the
 * freshly-provisioned Postgres hostname.
 */
const TRANSIENT_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "57P03", // postgres: cannot_connect_now (DB is starting up)
]);

function isTransient(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return typeof code === "string" && TRANSIENT_CODES.has(code);
}

async function connectWithRetry(): Promise<PoolClient> {
  const maxAttempts = 12;
  const baseDelayMs = 2000;
  const maxDelayMs = 15000;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
      } catch (err) {
        client.release();
        throw err;
      }
      if (attempt > 1) {
        logger.info({ attempt }, "Bootstrap: database reachable after retries");
      }
      return client;
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isTransient(err)) {
        throw err;
      }
      const delayMs = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const code = (err as { code?: string }).code;
      logger.warn(
        { attempt, maxAttempts, code, delayMs },
        "Bootstrap: database not reachable yet; will retry",
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/**
 * Bootstrap the database schema using plain SQL `CREATE TABLE IF NOT EXISTS`
 * statements. This runs once at API server startup, replacing the brittle
 * `drizzle-kit push-force` build step that kept failing on Render.
 *
 * Why hand-rolled SQL instead of drizzle-kit:
 *   - drizzle-kit needs to load its config file (`drizzle.config.ts`), which
 *     breaks on Windows path globs and on Render's free build network.
 *   - drizzle-kit at build time can't reach Render's internal database hostname.
 *   - Hand-rolled SQL with IF NOT EXISTS is idempotent, deterministic, and
 *     runs through the same `pg` connection the server already uses.
 *
 * If this function throws, the server will refuse to start (loud failure
 * instead of a silent sign-in loop).
 */
export async function bootstrapDatabase(): Promise<void> {
  logger.info("Bootstrap: connecting to database...");
  const client = await connectWithRetry();
  try {
    logger.info("Bootstrap: ensuring database schema...");
    await client.query("BEGIN");
    await client.query(SCHEMA_SQL);
    await client.query("COMMIT");

    // Sanity check: confirm every required table exists. If any are missing,
    // we want to know NOW, before the server starts serving 500s.
    const { rows } = await client.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const present = new Set(rows.map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
    if (missing.length > 0) {
      throw new Error(
        `Bootstrap failed: required tables missing after migration: ${missing.join(", ")}`,
      );
    }

    logger.info(
      { tables: REQUIRED_TABLES.length },
      "Bootstrap: schema ready",
    );
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  } finally {
    client.release();
  }
}

export const REQUIRED_TABLES = [
  "sessions",
  "users",
  "site_settings",
  "branches",
  "people",
  "departments",
  "announcements",
  "finance_transactions",
  "attendance_services",
  "storage_items",
  "social_links",
];

const SCHEMA_SQL = `
-- Required by Replit Auth pattern; kept for forward compatibility even though
-- the current app uses Firebase ID tokens (stateless).
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar PRIMARY KEY,
  "sess" jsonb NOT NULL,
  "expire" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "role" varchar NOT NULL DEFAULT 'member',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" serial PRIMARY KEY,
  "church_name" text NOT NULL,
  "abbreviation" text NOT NULL,
  "tagline" text,
  "mission_statement" text NOT NULL,
  "vision_statement" text NOT NULL,
  "core_values" text[] NOT NULL DEFAULT '{}',
  "address" text,
  "primary_phone" text,
  "primary_email" text,
  "hero_image_url" text,
  "logo_url" text,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "branches" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "is_main" boolean NOT NULL DEFAULT false,
  "location" text NOT NULL,
  "pastor_in_charge_name" text,
  "contact_phone" text,
  "contact_email" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "departments" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "branch_id" integer,
  "leader_id" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "people" (
  "id" serial PRIMARY KEY,
  "full_name" text NOT NULL,
  "role" text NOT NULL,
  "is_leader" boolean NOT NULL DEFAULT false,
  "branch_id" integer,
  "department_id" integer,
  "email" text,
  "phone" text,
  "photo_url" text,
  "bio" text,
  "joined_on" date,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "media_url" text,
  "media_type" text,
  "is_public" boolean NOT NULL DEFAULT true,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "branch_id" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "finance_transactions" (
  "id" serial PRIMARY KEY,
  "kind" text NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'UGX',
  "branch_id" integer,
  "occurred_on" date NOT NULL,
  "description" text,
  "recorded_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "attendance_services" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "branch_id" integer,
  "service_date" date NOT NULL,
  "adult_count" integer NOT NULL DEFAULT 0,
  "youth_count" integer NOT NULL DEFAULT 0,
  "children_count" integer NOT NULL DEFAULT 0,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "storage_items" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "file_url" text NOT NULL,
  "file_type" text,
  "file_size" integer,
  "uploaded_by" text,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "social_links" (
  "id" serial PRIMARY KEY,
  "platform" text NOT NULL,
  "url" text NOT NULL,
  "handle" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
`;
