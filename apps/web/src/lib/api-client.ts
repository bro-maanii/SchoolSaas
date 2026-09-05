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
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function parseEnvelope(res: Response): Promise<{ data: unknown; meta?: unknown }> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errorShape = json?.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(res.status, errorShape.code, errorShape.message, errorShape.details);
  }
  return json ?? { data: undefined };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawRequest("/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        const { data } = await parseEnvelope(res);
        return (data as { accessToken?: string } | undefined)?.accessToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function requestEnvelope(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: unknown; meta?: unknown }> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      useAuthStore.setState({ accessToken: newToken });
      res = await rawRequest(path, options);
    }
  }

  return parseEnvelope(res);
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestEnvelope(path, options);
  return data as T;
}

/** Like apiRequest, but also returns the response's `meta` (pagination totals, etc). */
export async function apiRequestWithMeta<T = unknown, M = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta: M }> {
  const { data, meta } = await requestEnvelope(path, options);
  return { data: data as T, meta: meta as M };
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
  upload: <T = unknown>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: "POST", body: formData }),
};

/** For endpoints that return a raw file (e.g. a CSV template) rather than the {data} envelope. */
export async function apiDownload(path: string): Promise<Blob> {
  let res = await rawRequest(path, { method: "GET" });
  if (res.status === 401 && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      useAuthStore.setState({ accessToken: newToken });
      res = await rawRequest(path, { method: "GET" });
    }
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const errorShape = json?.error ?? { code: "UNKNOWN", message: "Download failed" };
    throw new ApiError(res.status, errorShape.code, errorShape.message, errorShape.details);
  }
  return res.blob();
}

export { refreshAccessToken };
