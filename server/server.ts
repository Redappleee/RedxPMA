import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { connectDB } from "@/server/config/db";
import { serverEnv } from "@/server/config/env";
import { errorHandler, notFound } from "@/server/middleware/error-handler";
import { apiRateLimit, authRateLimit } from "@/server/middleware/rate-limit";
import analyticsRoutes from "@/server/routes/analytics.routes";
import authRoutes from "@/server/routes/auth.routes";
import notificationsRoutes from "@/server/routes/notifications.routes";
import productsRoutes from "@/server/routes/products.routes";
import searchRoutes from "@/server/routes/search.routes";
import settingsRoutes from "@/server/routes/settings.routes";
import teamRoutes from "@/server/routes/team.routes";
import uploadRoutes from "@/server/routes/upload.routes";
import { initSocket } from "@/server/socket";

const app = express();
const httpServer = createServer(app);
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");
const allowedOrigins = Array.from(new Set([serverEnv.CLIENT_URL, ...serverEnv.CLIENT_URLS].map(normalizeOrigin)));
const isDevelopment = serverEnv.NODE_ENV === "development";

const isAllowedVercelPreviewOrigin = (origin: string) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return (
      protocol === "https:" &&
      hostname.startsWith("redx-pma-netk-") &&
      hostname.endsWith("-redappleees-projects.vercel.app")
    );
  } catch {
    return false;
  }
};

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

      const normalizedOrigin = origin ? normalizeOrigin(origin) : origin;

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin) || isAllowedVercelPreviewOrigin(normalizedOrigin)) {
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
    message: "Nexus Labs API is running",
    health: "/api/health"
  });
});

app.get("/api", (_req, res) => {
  res.json({
    message: "Nexus Labs API root",
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
