import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { connectDB } from "@/api/config/db";
import { serverEnv } from "@/api/config/env";
import { errorHandler, notFound } from "@/api/middleware/error-handler";
import { apiRateLimit, authRateLimit } from "@/api/middleware/rate-limit";
import analyticsRoutes from "@/api/routes/analytics.routes";
import authRoutes from "@/api/routes/auth.routes";
import notificationsRoutes from "@/api/routes/notifications.routes";
import productsRoutes from "@/api/routes/products.routes";
import searchRoutes from "@/api/routes/search.routes";
import settingsRoutes from "@/api/routes/settings.routes";
import teamRoutes from "@/api/routes/team.routes";
import uploadRoutes from "@/api/routes/upload.routes";
import { initSocket } from "@/api/socket";

const app = express();
const httpServer = createServer(app);
const allowedOrigins = Array.from(new Set([serverEnv.CLIENT_URL, ...serverEnv.CLIENT_URLS]));
const isDevelopment = serverEnv.NODE_ENV === "development";

const uploadsPath = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isDevelopment) {
        callback(null, true);
        return;
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimit);
app.use("/uploads", express.static(uploadsPath));

app.get("/", (_req, res) => {
  res.json({
    message: "NexusPM API is running",
    health: "/api/health"
  });
});

app.get("/api", (_req, res) => {
  res.json({
    message: "NexusPM API root",
    health: "/api/health"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);

app.use(notFound);
app.use(errorHandler);

initSocket(httpServer);

const start = async () => {
  await connectDB();

  httpServer.listen(serverEnv.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API + Socket server running on http://localhost:${serverEnv.PORT}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
