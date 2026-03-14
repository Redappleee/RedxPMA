import { apiClient } from "@/lib/api-client";
import { IActivity, IUser } from "@/types";

export interface SearchProductResult {
  _id: string;
  name: string;
  category: string;
  status: "active" | "draft" | "archived";
  price: number;
  stock: number;
}

export interface GlobalSearchResult {
  products: SearchProductResult[];
  members: Pick<IUser, "_id" | "name" | "email" | "role" | "avatar">[];
  activities: Array<Pick<IActivity, "_id" | "action" | "entityType" | "entityId" | "createdAt" | "user">>;
}

export const searchService = {
  async global(q: string) {
    const { data } = await apiClient.get<GlobalSearchResult>("/search", {
      params: { q }
    });
    return data;
  }
};
