import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradeHistory } from "@/hooks/use-positions";
import { CheckCircle2 } from "lucide-react";
import type { Trade } from "@shared/schema";

export default function TradeHistory() {
  const { data: trades, isLoading } = useTradeHistory();

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

  const getPnLClass = (pnl: string | null | undefined) => {
    const num = parseFloat(pnl || "0");
    return num >= 0 ? "profit-text" : "loss-text";
  };

  const formatDuration = (openTime: Date | null | undefined, closeTime: Date | null | undefined) => {
    if (!openTime || !closeTime) return "Unknown";
    
    const diffMs = new Date(closeTime).getTime() - new Date(openTime).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getCloseReason = (trade: Trade) => {
    if (trade.tp1Hit && trade.status === "closed") {
      return "Closed at TP2 after partial close at TP1";
    } else if (trade.status === "closed" && !trade.tp1Hit) {
      return "Closed at Stop Loss";
    } else {
      return "Manually closed";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Trade History</h3>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Filter only closed trades
  const closedTrades = trades?.filter(trade => trade.status === "closed") || [];

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade History</h3>
        
        {closedTrades.length === 0 ? (
          <Card className="bg-slate-800 rounded-xl p-8 border-slate-700 text-center">
            <div className="text-slate-400">No completed trades</div>
            <div className="text-sm text-slate-500 mt-1">Completed trades will appear here</div>
          </Card>
        ) : (
          closedTrades.map((trade) => (
            <Card key={trade.id} className="bg-slate-800 rounded-xl p-6 border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="font-semibold">XAU/USD</span>
                  <Badge 
                    variant={trade.side === "buy" ? "default" : "destructive"}
                    className={trade.side === "buy" ? "bg-emerald-600" : "bg-red-600"}
                  >
                    {trade.side.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-600">
                    CLOSED
                  </Badge>
                </div>
                <div className="text-sm text-slate-400">
                  {formatDate(trade.closeTime)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Lot Size</div>
                  <div className="font-mono">{trade.lotSize}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Entry</div>
                  <div className="font-mono">{formatPrice(trade.entryPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Exit</div>
                  <div className="font-mono">{formatPrice(trade.currentPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Duration</div>
                  <div className="font-mono">
                    {formatDuration(trade.openTime, trade.closeTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Final P&L</div>
                  <div className={`font-mono ${getPnLClass(trade.realizedPL)}`}>
                    {formatCurrency(trade.realizedPL)}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-slate-400 flex items-center">
                <CheckCircle2 className="text-emerald-500 mr-2" size={16} />
                {getCloseReason(trade)}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
