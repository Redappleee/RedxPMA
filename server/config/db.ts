import mongoose from "mongoose";

import { serverEnv } from "@/server/config/env";

let isConnected = false;
mongoose.set("bufferCommands", false);

export const connectDB = async () => {
  if (isConnected) return;

  await mongoose.connect(serverEnv.MONGO_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000
  });

  isConnected = true;
};
