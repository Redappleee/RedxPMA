import { apiClient } from "@/lib/api-client";
import { IUser } from "@/types";

export const teamService = {
  async list() {
    const { data } = await apiClient.get<{ members: IUser[] }>("/team");
    return data.members;
  },
  async invite(payload: { name: string; email: string; role: "manager" | "member" }) {
    const { data } = await apiClient.post<{ message: string; invite: { email: string; temporaryPassword: string } }>(
      "/team/invite",
      payload
    );
    return data;
  },
  async updateRole(id: string, role: "admin" | "manager" | "member") {
    const { data } = await apiClient.patch<{ member: IUser }>(`/team/${id}/role`, { role });
    return data.member;
  },
  async remove(id: string) {
    const { data } = await apiClient.delete<{ message: string }>(`/team/${id}`);
    return data;
  }
};
