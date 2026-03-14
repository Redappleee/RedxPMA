import { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export const AuthShell = ({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => {
  return (
    <div className="container flex min-h-[calc(100vh-120px)] items-center justify-center py-10">
      <Card className="w-full max-w-md p-1">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
};
