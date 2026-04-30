import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";
import { REQUIRED_TABLES } from "../lib/bootstrap";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * /api/healthz/db — verifies the database is reachable and that every
 * required table exists. Use this from your browser after deploy to confirm
 * the schema bootstrap actually ran.
 *
 * 200 { status: "ok", tables: [...] }       — all good
 * 500 { status: "error", missing: [...] }   — schema incomplete (rare; bootstrap should have caught this)
 * 500 { status: "error", message: "..." }   — DB unreachable
 */
router.get("/healthz/db", async (_req, res) => {
  try {
    const result = await db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const present = new Set(result.rows.map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
    if (missing.length === 0) {
      res.json({ status: "ok", tables: REQUIRED_TABLES });
      return;
    }
    res.status(500).json({
      status: "error",
      message: "Database schema is incomplete.",
      missing,
      present: [...present],
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Could not connect to database",
      detail: (err as Error).message,
    });
  }
});

export default router;
