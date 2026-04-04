"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { authService } from "@/services/auth.service";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

const formSchema = z.object({
  token: z.string().min(8, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
      password: ""
    }
  });

  const resetMutation = useMutation({
    mutationFn: ({ token, password }: FormValues) => authService.resetPassword(token, password),
    onSuccess: (data) => {
      setMessage(data.message);
      form.reset({
        token: "",
        password: ""
      });
    },
    onError: (error) => setMessage(error.message)
  });

  return (
    <AuthShell title="Reset password" subtitle="Enter the reset token and choose a new password">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => resetMutation.mutate(values))}>
        <div>
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" placeholder="Paste reset token" {...form.register("token")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.token?.message}</p>
        </div>

        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="Create a new password" {...form.register("password")} />
          <p className="mt-1 text-xs text-danger">{form.formState.errors.password?.message}</p>
        </div>

        {message && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">{message}</p>}

        <Button className="w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        Back to{" "}
        <Link href="/login" className="text-primary">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
