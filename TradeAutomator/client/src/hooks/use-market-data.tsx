import { useQuery } from "@tanstack/react-query";

interface MarketData {
  bid: string;
  ask: string;
  spread: string;
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["/api/market/xauusd"],
    refetchInterval: 2000, // Update every 2 seconds
    staleTime: 1000,
  });
}
