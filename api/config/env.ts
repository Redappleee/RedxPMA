import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const clientUrlsSchema = z
  .string()
  .default("http://localhost:3005,http://localhost:3000")
  .transform((value) =>
    value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  )
  .pipe(z.array(z.string().url()).min(1));

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(12, "JWT_SECRET must be at least 12 chars"),
  CLIENT_URL: z.string().url().default("http://localhost:3005"),
  CLIENT_URLS: clientUrlsSchema,
  GOOGLE_CLIENT_ID: z.string().optional()
});

export const serverEnv = serverEnvSchema.parse(process.env);
