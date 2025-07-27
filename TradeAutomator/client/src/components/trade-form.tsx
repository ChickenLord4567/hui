import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUp, ArrowDown, Send, Loader2 } from "lucide-react";
import type { InsertTrade } from "@shared/schema";

export default function TradeForm() {
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [lotSize, setLotSize] = useState("0.10");
  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [sl, setSl] = useState("");
  const [partialClosePercent, setPartialClosePercent] = useState(75);
  
  const { toast } = useToast();

  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: InsertTrade) => {
      const response = await apiRequest("POST", "/api/trades", tradeData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Placed Successfully",
        description: `${orderType.toUpperCase()} ${lotSize} XAU/USD`,
      });
      
      // Reset form
      setTp1("");
      setTp2("");
      setSl("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tp1 || !tp2 || !sl) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all TP and SL levels",
        variant: "destructive",
      });
      return;
    }

    const tradeData: InsertTrade = {
      side: orderType,
      lotSize,
      tp1,
      tp2,
      sl,
      partialClosePercent,
    };

    placeTradeMutation.mutate(tradeData);
  };

  return (
    <div className="p-6 flex-1 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Place Order</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Order Type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => setOrderType("buy")}
              className={`px-4 py-3 rounded-xl font-semibold transition-colors ${
                orderType === "buy"
                  ? "trade-button-buy"
                  : "bg-slate-600 text-slate-300 hover:bg-green-600 hover:text-white"
              }`}
            >
              <ArrowUp className="mr-2" size={16} />
              BUY
            </Button>
            <Button
              type="button"
              onClick={() => setOrderType("sell")}
              className={`px-4 py-3 rounded-xl font-semibold transition-colors ${
                orderType === "sell"
                  ? "trade-button-sell"
                  : "bg-slate-600 text-slate-300 hover:bg-red-600 hover:text-white"
              }`}
            >
              <ArrowDown className="mr-2" size={16} />
              SELL
            </Button>
          </div>
        </div>
        
        {/* Lot Size */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Lot Size
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            placeholder="0.10"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            required
          />
        </div>
        
        {/* Take Profit 1 */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Take Profit 1 (TP1)
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={tp1}
              onChange={(e) => setTp1(e.target.value)}
              placeholder="1,990.00"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">
              USD
            </div>
          </div>
        </div>
        
        {/* Partial Close Percentage */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Close % at TP1
          </Label>
          <Select value={partialClosePercent.toString()} onValueChange={(value) => setPartialClosePercent(parseInt(value))}>
            <SelectTrigger className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Take Profit 2 */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Take Profit 2 (TP2)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={tp2}
            onChange={(e) => setTp2(e.target.value)}
            placeholder="1,995.00"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            required
          />
        </div>
        
        {/* Stop Loss */}
        <div>
          <Label className="block text-sm font-medium text-slate-300 mb-2">
            Stop Loss (SL)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            placeholder="1,980.00"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            required
          />
        </div>
        
        {/* Submit Button */}
        <Button
          type="submit"
          disabled={placeTradeMutation.isPending}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-[1.02] mt-6"
        >
          {placeTradeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Trade...
            </>
          ) : (
            <>
              <Send className="mr-2" size={16} />
              Place Trade
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
