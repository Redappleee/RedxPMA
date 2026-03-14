"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Reorder, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { ProductCard } from "@/components/products/product-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useRealtime } from "@/hooks/use-realtime";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/store/auth-store";
import { IProduct } from "@/types";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "newest");
  const [items, setItems] = useState<IProduct[]>([]);
  const userId = useAuthStore((state) => state.user?._id);
  const role = useAuthStore((state) => state.user?.role);
  const canManageProducts = role === "admin" || role === "manager";

  const debouncedSearch = useDebounce(search);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { sort };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (status) params.status = status;
    return params;
  }, [debouncedSearch, category, status, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productService.list(queryParams)
  });

  useEffect(() => {
    setItems(data ?? []);
  }, [data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  useRealtime("product:created", refresh, userId);
  useRealtime("product:updated", refresh, userId);
  useRealtime("product:deleted", refresh, userId);

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: refresh
  });

  return (
    <section className="space-y-4">
      <TopNav onSearch={setSearch} />

      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="">All categories</option>
            <option value="SaaS">SaaS</option>
            <option value="AI Tooling">AI Tooling</option>
            <option value="Security">Security</option>
            <option value="Productivity">Productivity</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_high">Price high</option>
            <option value="price_low">Price low</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>

        {canManageProducts ? (
          <Button asChild>
            <Link href="/products/new">Add Product</Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">View-only access for member role</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <Reorder.Item key={product._id} value={product} className="list-none">
              <motion.div layout className="space-y-2">
                <ProductCard product={product} />
                {canManageProducts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-danger"
                    onClick={() => deleteMutation.mutate(product._id)}
                  >
                    Delete
                  </Button>
                )}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </section>
  );
}
