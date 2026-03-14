import { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { serverEnv } from "@/api/config/env";
import { setSocketServer } from "@/api/socket/events";

export const initSocket = (server: HttpServer) => {
  const allowedOrigins = Array.from(new Set([serverEnv.CLIENT_URL, ...serverEnv.CLIENT_URLS]));
  const isDevelopment = serverEnv.NODE_ENV === "development";

  const io = new Server(server, {
    cors: {
      origin: isDevelopment
        ? (_origin, callback) => callback(null, true)
        : (_origin, callback) => callback(null, Boolean(_origin && allowedOrigins.includes(_origin))),
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("product:subscribe", (productId: string) => {
      socket.join(`product:${productId}`);
    });

    socket.on("product:unsubscribe", (productId: string) => {
      socket.leave(`product:${productId}`);
    });
  });

  setSocketServer(io);
  return io;
};
