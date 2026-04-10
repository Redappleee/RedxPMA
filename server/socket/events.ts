import { Server } from "socket.io";

let ioInstance: Server | null = null;

export const setSocketServer = (io: Server) => {
  ioInstance = io;
};

export const emitSocketEvent = (event: string, payload: unknown) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};
