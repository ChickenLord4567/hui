import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";
import { TrendingUp, LogOut, BarChart3 } from "lucide-react";
import MarketData from "@/components/market-data";
import TradeForm from "@/components/trade-form";
import PositionsPanel from "@/components/positions-panel";
import TradeHistory from "@/components/trade-history";
import NotificationSystem from "@/components/notification-system";
import CandlestickChart from "@/components/candlestick-chart";
import { useAccount } from "@/hooks/use-positions";

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState<"positions" | "history" | "chart">("chart");
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const { data: account } = useAccount();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">XAUUSD Trader</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Live Market</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-slate-400">Balance:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${account?.balance || "10,000.00"}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {isChartFullscreen ? (
        <CandlestickChart 
          fullscreen={true} 
          onToggleFullscreen={() => setIsChartFullscreen(false)} 
        />
      ) : (
        <div className="flex flex-col lg:flex-row h-screen pt-16">
          {/* Left Panel: Market Info & Trade Form */}
          <div className="w-full lg:w-1/3 bg-slate-800 border-r border-slate-700 flex flex-col">
            <MarketData />
            <TradeForm />
          </div>
          
          {/* Right Panel: Chart, Positions & History */}
          <div className="flex-1 bg-slate-900 flex flex-col">
            {/* Tab Navigation */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`px-4 py-2 font-semibold transition-colors flex items-center space-x-2 ${
                    activeTab === "chart"
                      ? "text-emerald-400 border-b-2 border-emerald-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>Live Chart</span>
                </button>
                <button
                  onClick={() => setActiveTab("positions")}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === "positions"
                      ? "text-emerald-400 border-b-2 border-emerald-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Active Positions
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === "history"
                      ? "text-emerald-400 border-b-2 border-emerald-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Trade History
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "chart" && (
                <div className="p-6">
                  <CandlestickChart 
                    height={500} 
                    onToggleFullscreen={() => setIsChartFullscreen(true)} 
                  />
                </div>
              )}
              {activeTab === "positions" && <PositionsPanel />}
              {activeTab === "history" && <TradeHistory />}
            </div>
          </div>
        </div>
      )}
      
      <NotificationSystem />
    </div>
  );
}
