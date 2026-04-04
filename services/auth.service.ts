import { apiClient } from "@/lib/api-client";
import { DashboardWidgetKey } from "@/types/dashboard";
import { AuthResponse, IUser } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginPayload {
  name: string;
  role?: "admin" | "manager" | "member";
}

export interface GoogleAuthPayload {
  idToken: string;
  role?: "admin" | "manager" | "member";
}

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },
  async signup(payload: SignupPayload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/signup", payload);
    return data;
  },
  async googleAuth(payload: GoogleAuthPayload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/google", payload);
    return data;
  },
  async me() {
    const { data } = await apiClient.get<{ user: IUser }>("/auth/me");
    return data.user;
  },
  async updateProfile(payload: { name: string; avatar?: string }) {
    const { data } = await apiClient.patch<{ user: IUser }>("/auth/profile", payload);
    return data.user;
  },
  async getDashboardLayout() {
    const { data } = await apiClient.get<{ layout: DashboardWidgetKey[] }>("/auth/preferences/dashboard-layout");
    return data.layout;
  },
  async updateDashboardLayout(layout: DashboardWidgetKey[]) {
    const { data } = await apiClient.put<{ layout: DashboardWidgetKey[] }>("/auth/preferences/dashboard-layout", {
      layout
    });
    return data.layout;
  },
  async forgotPassword(email: string) {
    const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", {
      email
    });
    return data;
  },
  async resetPassword(token: string, password: string) {
    const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", {
      token,
      password
    });
    return data;
  },
  async logout() {
    await apiClient.post("/auth/logout");
  }
};
