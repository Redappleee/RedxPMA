import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Enter the reset token and choose a new password">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
