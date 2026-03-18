import axios from "axios";

import { env } from "@/lib/env";

const normalizeApiBaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/api";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
};

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(env.NEXT_PUBLIC_API_URL),
  withCredentials: true,
  timeout: 10000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error?.config?.method ? String(error.config.method).toUpperCase() : "REQUEST";
    const requestUrl = error?.config?.url ?? "";
    const status = error?.response?.status;
    let message = error?.response?.data?.message;

    if (!message && axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      message = "Request timed out. Check API server status and database connectivity.";
    }

    if (!message && axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      message = `Cannot reach API server (connection refused or blocked). Ensure backend is running and reachable at ${apiClient.defaults.baseURL}.`;
    }

    if (!message && axios.isAxiosError(error) && !error.response) {
      message = "Network error reaching API.";
    }

    if (!message) {
      message = error?.message ?? "Unexpected request error";
    }

    if (status) {
      return Promise.reject(new Error(`${status} ${method} ${requestUrl}: ${message}`));
    }

    return Promise.reject(new Error(`${method} ${requestUrl}: ${message}`));
  }
);
