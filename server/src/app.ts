import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

const app = express();

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    // In dev, Vite may bump to another port if 5173 is busy (e.g. a second `npm run dev`
    // left running) — reflect any localhost origin instead of hardcoding one port so the
    // app doesn't break with a CORS error every time that happens. Production stays locked
    // to CLIENT_ORIGIN.
    origin:
      env.nodeEnv === "production"
        ? env.clientOrigin
        : (origin, callback) => {
            if (!origin || LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
            callback(null, env.clientOrigin === origin);
          },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "stockflow-api" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
