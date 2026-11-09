import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Render (and most hosts) sit behind one reverse proxy. Trusting it lets
  // express-rate-limit key on the real client IP from X-Forwarded-For instead of
  // putting every user in the proxy's bucket.
  app.set("trust proxy", 1);
  app.use(helmet());
  // Browsers send Origin without a trailing slash, so strip one if it was configured.
  const allowedOrigins = env.CLIENT_ORIGIN.split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.use("/api", router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
