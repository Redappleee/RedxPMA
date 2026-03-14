import { apiClient } from "@/lib/api-client";

export const uploadService = {
  async image(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await apiClient.post<{ url: string }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return data.url;
  }
};
