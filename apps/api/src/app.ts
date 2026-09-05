import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { v1Router } from "@/api/v1";
import { errorMiddleware } from "@/middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/health", (req, res) => {
  res.json({ data: { status: "ok" } });
});

app.use("/api/v1", v1Router);

app.use(errorMiddleware);
