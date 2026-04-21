"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
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
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include uppercase")
    .regex(/[a-z]/, "Must include lowercase")
    .regex(/[0-9]/, "Must include number"),
  role: z.enum(["admin", "manager", "member"])
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const { setAuth } = useAuthStore();
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "member"
    }
  });

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      window.location.assign("/dashboard");
    },
    onError: (error) => setMessage(error.message)
  });

  return (
    <AuthShell title="Create workspace" subtitle="Launch your product operating hub in minutes">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => signupMutation.mutate(values))}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" {...form.register("name")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.name?.message}</p>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="you@company.com" {...form.register("email")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.email?.message}</p>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Create a secure password" {...form.register("password")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.password?.message}</p>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
            {...form.register("role")}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
          </select>
        </div>

        {message && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">{message}</p>}

        <Button className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? "Creating..." : "Create account"}
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleAuthProvider>
        <GoogleAuthButton role={form.watch("role")} redirectTo="/dashboard" onError={setMessage} />
      </GoogleAuthProvider>
      <div className="mt-4 text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary">Sign in</Link>
      </div>
    </AuthShell>
  );
}
