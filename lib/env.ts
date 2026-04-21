import { z } from "zod";

const defaults = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3050",
  NEXT_PUBLIC_API_URL: "http://localhost:4000/api"
} as const;

const urlSchema = z.string().url();

const resolveUrl = (value: string | undefined, fallback: string) => {
  const result = urlSchema.safeParse(value);
  return result.success ? result.data : fallback;
};

export const env = {
  NEXT_PUBLIC_APP_URL: resolveUrl(process.env.NEXT_PUBLIC_APP_URL, defaults.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_API_URL: resolveUrl(process.env.NEXT_PUBLIC_API_URL, defaults.NEXT_PUBLIC_API_URL),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined
};
