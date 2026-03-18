"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { productService } from "@/services/product.service";
import { settingsService } from "@/services/settings.service";
import { teamService } from "@/services/team.service";
import { uploadService } from "@/services/upload.service";
import { useAuthStore } from "@/store/auth-store";
import { IProduct } from "@/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(12),
  category: z.string().min(2),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  status: z.enum(["active", "draft", "archived"]),
  image: z.string().url().optional().or(z.literal("")),
  assignedManagers: z.array(z.string()).default([])
});

type FormValues = z.infer<typeof formSchema>;

export const ProductForm = ({ product }: { product?: IProduct }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManageProducts = role === "admin" || role === "manager";
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [managerSelection, setManagerSelection] = useState("");

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["team", "for-product-assignment"],
    queryFn: teamService.list,
    enabled: canManageProducts
  });
  const { data: settingsData } = useQuery({
    queryKey: ["settings", "product-form"],
    queryFn: settingsService.get,
    enabled: canManageProducts
  });

  const managerUsers = teamMembers.filter((member) => member.role === "manager" || member.role === "admin");
  const productDefaults = settingsData?.settings.productDefaults;
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [productDefaults?.defaultCategory, ...PRODUCT_CATEGORIES].filter((value): value is string => Boolean(value))
        )
      ),
    [productDefaults?.defaultCategory]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? productDefaults?.defaultCategory ?? PRODUCT_CATEGORIES[0],
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      status: product?.status ?? productDefaults?.defaultStatus ?? "draft",
      image: product?.image ?? "",
      assignedManagers: product?.assignedManagers?.map((manager) => manager._id) ?? []
    }
  });

  useEffect(() => {
    if (!product && productDefaults && !form.formState.isDirty) {
      form.reset({
        name: "",
        description: "",
        category: productDefaults.defaultCategory || PRODUCT_CATEGORIES[0],
        price: 0,
        stock: 0,
        status: productDefaults.defaultStatus,
        image: "",
        assignedManagers: []
      });
    }
  }, [form, form.formState.isDirty, product, productDefaults]);

  const selectedManagerIds = form.watch("assignedManagers");
  const selectedManagers = managerUsers.filter((user) => selectedManagerIds.includes(user._id));

  const addSelectedManager = () => {
    if (!managerSelection) return;
    if (selectedManagerIds.includes(managerSelection)) return;
    form.setValue("assignedManagers", [...selectedManagerIds, managerSelection], { shouldDirty: true });
    setManagerSelection("");
  };

  const removeManager = (managerId: string) => {
    form.setValue(
      "assignedManagers",
      selectedManagerIds.filter((id) => id !== managerId),
      { shouldDirty: true }
    );
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        image: values.image || undefined
      };

      if (product) {
        return productService.update(product._id, payload);
      }

      return productService.create(payload);
    },
    onSuccess: async (savedProduct) => {
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/products/${savedProduct._id}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to save product";
      setFormError(message);
    }
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canManageProducts) {
      setFormError("Only admin or manager accounts can upload images.");
      return;
    }

    try {
      setUploading(true);
      setFormError(null);
      const url = await uploadService.image(file);
      form.setValue("image", url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      setFormError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {formError && (
            <div className="md:col-span-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </div>
          )}
          {!canManageProducts && (
            <div className="md:col-span-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
              Your role is `member`. Only `admin` and `manager` can create or edit products.
            </div>
          )}
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input placeholder="Product name" disabled={!canManageProducts} {...form.register("name")} />
            <p className="mt-1 text-xs text-danger">{form.formState.errors.name?.message}</p>
          </div>

          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Detailed product description"
              disabled={!canManageProducts}
              {...form.register("description")}
            />
            <p className="mt-1 text-xs text-danger">{form.formState.errors.description?.message}</p>
          </div>

          <div>
            <Label>Category</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
              disabled={!canManageProducts}
              {...form.register("category")}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
              disabled={!canManageProducts}
              {...form.register("status")}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <Label>Price</Label>
            <Input type="number" min={0} step={1} disabled={!canManageProducts} {...form.register("price")} />
          </div>

          <div>
            <Label>Stock</Label>
            <Input type="number" min={0} step={1} disabled={!canManageProducts} {...form.register("stock")} />
            {productDefaults && (
              <p className="mt-1 text-xs text-muted-foreground">
                Stock at or below {productDefaults.lowStockThreshold} will be flagged as low inventory.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>Manager users</Label>
            <p className="mb-2 text-xs text-muted-foreground">Assign existing manager/admin users to this product.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={managerSelection}
                onChange={(event) => setManagerSelection(event.target.value)}
                disabled={!canManageProducts || teamLoading || managerUsers.length === 0}
              >
                <option value="">
                  {teamLoading
                    ? "Loading users..."
                    : managerUsers.length === 0
                      ? "No manager users available"
                      : "Select manager user"}
                </option>
                {managerUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={addSelectedManager}
                disabled={!canManageProducts || !managerSelection}
              >
                Add manager
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedManagers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No managers assigned yet.</p>
              ) : (
                selectedManagers.map((manager) => (
                  <Badge key={manager._id} variant="info" className="gap-2 py-1.5">
                    <span>{manager.name}</span>
                    <button
                      type="button"
                      className="rounded px-1 text-[10px] hover:bg-primary/20"
                      onClick={() => removeManager(manager._id)}
                      disabled={!canManageProducts}
                    >
                      Remove
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Image upload</Label>
            <Input type="file" accept="image/*" disabled={!canManageProducts || uploading} onChange={handleFileChange} />
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading image...</p>}
            {form.watch("image") && (
              <p className="mt-2 text-xs text-muted-foreground">Uploaded URL: {form.watch("image")}</p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button disabled={!canManageProducts || mutation.isPending || uploading}>
              {mutation.isPending ? "Saving..." : "Save product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
