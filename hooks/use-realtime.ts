"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

import { env } from "@/lib/env";

let socket: Socket | null = null;

export const useRealtime = <T = unknown>(
  event: string,
  callback: (payload: T) => void,
  userId?: string
) => {
  useEffect(() => {
    const apiOrigin = env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "");

    if (!socket) {
      socket = io(apiOrigin, {
        transports: ["polling", "websocket"],
        withCredentials: true,
        auth: userId ? { userId } : undefined,
        timeout: 10000
      });
    } else if (userId) {
      socket.auth = { userId };
      if (!socket.connected) {
        socket.connect();
      }
    }

    socket.on(event, callback);

    return () => {
      socket?.off(event, callback);
    };
  }, [event, callback, userId]);
};
