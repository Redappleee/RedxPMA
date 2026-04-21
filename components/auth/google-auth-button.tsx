"use client";

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { Route } from "next";

import { env } from "@/lib/env";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

interface GoogleAuthButtonProps {
  role?: "admin" | "manager" | "member";
  redirectTo?: string;
  onError?: (message: string) => void;
}

export const GoogleAuthButton = ({ role, redirectTo = "/dashboard", onError }: GoogleAuthButtonProps) => {
  const { setAuth } = useAuthStore();

  const googleMutation = useMutation({
    mutationFn: authService.googleAuth,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      window.location.assign(redirectTo as Route);
    },
    onError: (error) => onError?.(error.message)
  });

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google authentication returned no credential");
      return;
    }

    googleMutation.mutate({
      idToken: response.credential,
      role
    });
  };

  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        theme="outline"
        shape="pill"
        text="continue_with"
      />
    </div>
  );
};
