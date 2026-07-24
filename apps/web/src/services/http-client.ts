import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiSuccessResponse, RefreshResponse } from "@/features/auth/types";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth-store";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

httpClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken !== null) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

const shouldAttemptRefresh = (error: AxiosError): boolean => {
  const originalRequest = error.config as RetriableRequestConfig | undefined;
  const url = originalRequest?.url ?? "";
  const isAuthBootstrapEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

  return error.response?.status === 401 && originalRequest !== undefined && originalRequest._retry !== true && !isAuthBootstrapEndpoint;
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !shouldAttemptRefresh(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig;
    originalRequest._retry = true;

    try {
      const response = await axios.post<ApiSuccessResponse<RefreshResponse>>(`${env.apiBaseUrl}/auth/refresh`, undefined, { withCredentials: true });
      const accessToken = response.data.data.accessToken;
      useAuthStore.getState().setAccessToken(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return httpClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    }
  }
);

