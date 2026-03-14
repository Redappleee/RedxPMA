import { apiClient } from "@/lib/api-client";
import { DashboardRange } from "@/types/dashboard";
import { IProduct } from "@/types";

export interface ProductPayload {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  image?: string;
  assignedManagers?: string[];
}

export const productService = {
  async list(params?: Record<string, string>) {
    const { data } = await apiClient.get<{ products: IProduct[] }>("/products", { params });
    return data.products;
  },
  async dashboard(range: DashboardRange = "30d") {
    const { data } = await apiClient.get("/products/dashboard", { params: { range } });
    return data;
  },
  async getById(id: string) {
    const { data } = await apiClient.get<{ product: IProduct }>(`/products/${id}`);
    if (!data?.product) {
      throw new Error("Product not found in API response");
    }
    return data.product;
  },
  async create(payload: ProductPayload) {
    const { data } = await apiClient.post<{ product: IProduct }>("/products", payload);
    return data.product;
  },
  async update(id: string, payload: Partial<ProductPayload>) {
    const { data } = await apiClient.patch<{ product: IProduct }>(`/products/${id}`, payload);
    return data.product;
  },
  async delete(id: string) {
    await apiClient.delete(`/products/${id}`);
  },
  async addComment(id: string, message: string) {
    await apiClient.post(`/products/${id}/comments`, { message });
  }
};
