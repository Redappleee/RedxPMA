"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MessageCircle, Package } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { productService } from "@/services/product.service";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Textarea } from "@/ui/textarea";
import { timeAgo } from "@/utils/date";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId;

  const {
    data: product,
    isLoading,
    error
  } = useQuery({
    queryKey: ["product", productId],
    enabled: Boolean(productId),
    retry: false,
    queryFn: async () => {
      if (!productId) {
        throw new Error("Missing product id");
      }
      return productService.getById(productId);
    }
  });

  const commentMutation = useMutation({
    mutationFn: (message: string) => {
      if (!productId) {
        throw new Error("Missing product id");
      }
      return productService.addComment(productId, message);
    },
    onSuccess: async () => {
      setComment("");
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });
    }
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <TopNav />
        <Card className="p-8 text-center text-muted-foreground">Loading product...</Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <TopNav />
        <Card className="p-8 text-center text-danger">
          {error instanceof Error ? error.message : "Failed to load product"}
        </Card>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="space-y-4">
        <TopNav />
        <Card className="p-8 text-center text-muted-foreground">Product unavailable.</Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <TopNav />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="overflow-hidden p-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={1200}
              height={600}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="h-72 bg-muted" />
          )}
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold">{product.name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
              </div>
              <Badge variant={product.status === "active" ? "success" : product.status === "draft" ? "warning" : "neutral"}>
                {product.status}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="mt-1 text-lg font-semibold">${product.price}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="mt-1 text-lg font-semibold">{product.stock}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="mt-1 text-lg font-semibold">{product.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader>
            <CardTitle>Assigned managers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.assignedManagers.length === 0 && (
              <p className="text-sm text-muted-foreground">No managers assigned.</p>
            )}
            {product.assignedManagers.map((manager) => (
              <div key={manager._id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-medium">{manager.name}</p>
                <p className="text-xs text-muted-foreground">
                  {manager.email} • {manager.role}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-1">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" />
            <Button onClick={() => commentMutation.mutate(comment)} disabled={!comment || commentMutation.isPending}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {commentMutation.isPending ? "Posting..." : "Post comment"}
            </Button>
            <div className="space-y-2 pt-2">
              {product.comments.map((item) => (
                <div key={item._id} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-sm font-medium">{item.user?.name ?? "Teammate"}</p>
                  <p className="mt-1 text-sm">{item.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Product record created
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(product.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Last updated
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(product.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
