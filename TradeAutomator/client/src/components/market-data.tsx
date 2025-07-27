import { useMarketData } from "@/hooks/use-market-data";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketData() {
  const { data: marketData, isLoading, error } = useMarketData();

  if (error) {
    return (
      <div className="p-6 border-b border-slate-700">
        <div className="text-red-400 text-sm">Failed to load market data</div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">XAU/USD</h2>
        <div className="text-xs text-slate-400">GOLD/US DOLLAR</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-700 p-4 rounded-xl border-none">
          <div className="text-xs text-slate-400 mb-1">BID</div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-mono font-bold text-red-400 price-flash">
              {marketData?.bid || "1,987.23"}
            </div>
          )}
        </Card>
        
        <Card className="bg-slate-700 p-4 rounded-xl border-none">
          <div className="text-xs text-slate-400 mb-1">ASK</div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-400 price-flash">
              {marketData?.ask || "1,987.45"}
            </div>
          )}
        </Card>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-400">Spread:</span>
        <span className="font-mono">
          {isLoading ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            marketData?.spread || "0.22"
          )}
        </span>
      </div>
    </div>
  );
}
