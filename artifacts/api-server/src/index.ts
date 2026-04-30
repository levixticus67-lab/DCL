import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapDatabase } from "./lib/bootstrap";

async function main() {
  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  // Create/verify schema BEFORE accepting any traffic. If this fails the
  // process exits — much better than serving 500s and silently looping
  // users back to the sign-in page.
  try {
    await bootstrapDatabase();
  } catch (err) {
    logger.fatal({ err }, "Database bootstrap failed; refusing to start.");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
