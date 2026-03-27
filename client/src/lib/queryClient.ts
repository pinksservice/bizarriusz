import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(queryKey[0] as string, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
  },
});
