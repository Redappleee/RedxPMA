"use client";

import { TopNav } from "@/components/layout/top-nav";
import { ProductForm } from "@/components/products/product-form";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/ui/card";

export default function NewProductPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canManageProducts = role === "admin" || role === "manager";

  return (
    <section className="space-y-4">
      <TopNav />
      <div>
        <h1 className="text-3xl font-semibold">Add product</h1>
        <p className="text-sm text-muted-foreground">Create a new product record with pricing, stock, and ownership.</p>
      </div>
      {!canManageProducts ? (
        <Card className="p-6">
          <CardContent className="p-0 text-sm text-muted-foreground">
            Only <span className="font-medium text-foreground">admin</span> and{" "}
            <span className="font-medium text-foreground">manager</span> roles can create products.
          </CardContent>
        </Card>
      ) : (
        <ProductForm />
      )}
    </section>
  );
}
