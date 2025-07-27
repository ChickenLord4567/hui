import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositions, useAccount } from "@/hooks/use-positions";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";
import type { Trade } from "@shared/schema";

export default function PositionsPanel() {
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: account, isLoading: accountLoading } = useAccount();
  const { toast } = useToast();

  const closePositionMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/close`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Position Closed",
        description: "Trade has been closed successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    },
    onError: (error: any) => {
      toast({
        title: "Close Failed",
        description: error.message || "Failed to close position",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: string | null | undefined) => {
    const num = parseFloat(value || "0");
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatPrice = (value: string | null | undefined) => {
    const num = parseFloat(value || "0");
    return num.toFixed(2);
  };

  const getStatusInfo = (trade: Trade) => {
    if (trade.status === "closed") {
      return { text: "Closed", className: "status-closed" };
    } else if (trade.tp1Hit) {
      return { text: "TP1 Hit - SL at Breakeven", className: "status-tp1-hit" };
    } else {
      return { text: "Monitoring TP1", className: "status-monitoring" };
    }
  };

  const getPnLClass = (pnl: string | null | undefined) => {
    const num = parseFloat(pnl || "0");
    return num >= 0 ? "profit-text" : "loss-text";
  };

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  if (positionsLoading || accountLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800 p-4 rounded-xl border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Account Balance</div>
          <div className="text-xl font-mono font-bold">
            {formatCurrency(account?.balance)}
          </div>
        </Card>
        <Card className="bg-slate-800 p-4 rounded-xl border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Unrealized P&L</div>
          <div className={`text-xl font-mono font-bold ${getPnLClass(account?.unrealizedPL)}`}>
            {formatCurrency(account?.unrealizedPL)}
          </div>
        </Card>
        <Card className="bg-slate-800 p-4 rounded-xl border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Margin Used</div>
          <div className="text-xl font-mono font-bold">
            {formatCurrency(account?.marginUsed)}
          </div>
        </Card>
      </div>
      
      {/* Active Positions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span>Active Positions</span>
          <Badge variant="secondary" className="ml-2 bg-emerald-600 text-white">
            {positions?.length || 0}
          </Badge>
        </h3>
        
        {!positions || positions.length === 0 ? (
          <Card className="bg-slate-800 rounded-xl p-8 border-slate-700 text-center">
            <div className="text-slate-400">No active positions</div>
            <div className="text-sm text-slate-500 mt-1">Place a trade to see positions here</div>
          </Card>
        ) : (
          positions.map((trade) => {
            const status = getStatusInfo(trade);
            
            return (
              <Card key={trade.id} className="bg-slate-800 rounded-xl p-6 border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="font-semibold">XAU/USD</span>
                    <Badge 
                      variant={trade.side === "buy" ? "default" : "destructive"}
                      className={trade.side === "buy" ? "bg-emerald-600" : "bg-red-600"}
                    >
                      {trade.side.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-400">
                    {formatTime(trade.openTime)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Lot Size</div>
                    <div className="font-mono">{trade.lotSize}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Entry Price</div>
                    <div className="font-mono">{formatPrice(trade.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Current Price</div>
                    <div className="font-mono">{formatPrice(trade.currentPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">P&L</div>
                    <div className={`font-mono ${getPnLClass(trade.unrealizedPL)}`}>
                      {formatCurrency(trade.unrealizedPL)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      TP1 ({trade.partialClosePercent}% close)
                    </div>
                    <div className="font-mono">{formatPrice(trade.tp1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">TP2 (Final close)</div>
                    <div className="font-mono">{formatPrice(trade.tp2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
                    <div className="font-mono text-red-400">{formatPrice(trade.sl)}</div>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.status === "closed" ? "bg-gray-500" :
                      trade.tp1Hit ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    }`}></div>
                    <span className={`text-sm ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  {trade.status !== "closed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => closePositionMutation.mutate(trade.id)}
                      disabled={closePositionMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {closePositionMutation.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <X className="mr-1" size={12} />
                      )}
                      Close Position
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
