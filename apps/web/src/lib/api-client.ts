import { API_URL } from "./config";
import { useAuthStore } from "@/store/auth-store";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function rawRequest(path: string, options: RequestOptions = {}) {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function parseResponse(res: Response) {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errorShape = json?.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(res.status, errorShape.code, errorShape.message, errorShape.details);
  }
  return json?.data;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawRequest("/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await parseResponse(res);
        return data?.accessToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      useAuthStore.setState({ accessToken: newToken });
      res = await rawRequest(path, options);
    }
  }

  return parseResponse(res) as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

export { refreshAccessToken };
