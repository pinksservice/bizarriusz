import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch("/api/auth/user", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
  };
}
