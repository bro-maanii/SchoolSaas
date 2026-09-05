"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Toaster } from "@/components/ui/toaster";

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return new QueryClient();
  browserQueryClient ??= new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  });
  return browserQueryClient;
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    api
      .post<{ accessToken: string }>("/auth/refresh")
      .then(async (data) => {
        if (cancelled) return;
        useAuthStore.setState({ accessToken: data.accessToken });
        const me = await api.get<{ user: import("@/store/auth-store").SessionUser }>("/auth/me").catch(() => null);
        if (cancelled) return;
        if (me?.user) {
          setSession(data.accessToken, me.user);
        } else {
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster />
    </QueryClientProvider>
  );
}
