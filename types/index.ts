import type { DashboardWidgetKey } from "@/types/dashboard";

export type Role = "admin" | "manager" | "member";

export type ProductStatus = "active" | "draft" | "archived";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  preferences?: {
    dashboardLayout: DashboardWidgetKey[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  user: Pick<IUser, "_id" | "name" | "email" | "role">;
  message: string;
  createdAt: string;
}

export interface IActivity {
  _id: string;
  user: Pick<IUser, "_id" | "name" | "email" | "role">;
  action: string;
  entityType: "product" | "team" | "system";
  entityId: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image?: string;
  assignedManagers: IUser[];
  comments: IComment[];
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "danger";
  isRead: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalInventory: number;
  monthlyRevenue: number;
  growthPercentage: number;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
}
