import { apiClient } from "@/lib/api-client";
import { INotification } from "@/types";

export const notificationService = {
  async list() {
    const { data } = await apiClient.get<{ notifications: INotification[] }>("/notifications");
    return Array.isArray(data.notifications) ? data.notifications : [];
  },
  async markRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  }
};
