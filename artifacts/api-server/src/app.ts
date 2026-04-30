import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

const corsOriginsRaw = process.env.CORS_ORIGINS ?? "";
const corsOrigins = corsOriginsRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (curl, server-to-server, same-origin)
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0) return callback(null, true);
      if (corsOrigins.includes(origin) || corsOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: false,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
