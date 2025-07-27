import { useQuery } from "@tanstack/react-query";
import type { Trade, Account } from "@shared/schema";

interface TradeStatus {
  activeTrades: Trade[];
  account: Account;
}

export function usePositions() {
  return useQuery<Trade[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 5000, // Update every 5 seconds
  });
}

export function useTradeHistory() {
  return useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    refetchInterval: 10000, // Update every 10 seconds
  });
}

export function useAccount() {
  return useQuery<Account>({
    queryKey: ["/api/account"],
    refetchInterval: 5000, // Update every 5 seconds
  });
}

export function useTradeStatus() {
  return useQuery<TradeStatus>({
    queryKey: ["/api/trades/status"],
    refetchInterval: 5000, // Update every 5 seconds
  });
}
