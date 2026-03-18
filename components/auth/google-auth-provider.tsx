"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

import { env } from "@/lib/env";

export const GoogleAuthProvider = ({ children }: { children: ReactNode }) => {
  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
};
