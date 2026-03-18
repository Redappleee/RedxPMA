"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { GoogleAuthProvider } from "@/components/auth/google-auth-provider";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const redirect =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard"
      : "/dashboard";

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push(redirect as Route);
    },
    onError: (error) => setMessage(error.message)
  });

  const forgotMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (data) => {
      setMessage(data.token ? `Reset token: ${data.token}` : data.message);
    },
    onError: (error) => setMessage(error.message)
  });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your RedxPMA workspace">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="you@company.com" {...form.register("email")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.email?.message}</p>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.password?.message}</p>
        </div>

        {message && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">{message}</p>}

        <Button className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleAuthProvider>
        <GoogleAuthButton redirectTo={redirect} onError={setMessage} />
      </GoogleAuthProvider>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={() => forgotMutation.mutate(form.getValues("email"))}
          className="text-primary"
          type="button"
          disabled={forgotMutation.isPending || !form.getValues("email")}
        >
          Forgot password?
        </button>
        <Link href="/signup" className="text-muted-foreground hover:text-foreground">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
