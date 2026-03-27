import { useQuery } from "@tanstack/react-query";

export function useAds(filters?: { category?: string }) {
  return useQuery({
    queryKey: ["/api/ads", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      const res = await fetch(`/api/ads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
  });
}
