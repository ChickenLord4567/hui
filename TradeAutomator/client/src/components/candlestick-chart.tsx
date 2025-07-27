import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Maximize2 } from "lucide-react";
import type { Trade } from "../../../shared/schema";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  height?: number;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function CandlestickChart({ 
  height = 400, 
  fullscreen = false, 
  onToggleFullscreen 
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const tradeLinesRef = useRef<any[]>([]);
  const [isChartReady, setIsChartReady] = useState(false);
  const [timeframe, setTimeframe] = useState("M1");

  const { data: candleData, isLoading, error } = useQuery<CandleData[]>({
    queryKey: ["/api/market/xauusd/candles", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/xauusd/candles?granularity=${timeframe}&count=500`);
      if (!response.ok) {
        throw new Error('Failed to fetch candlestick data');
      }
      return response.json();
    },
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 2000,
  });

  // Fetch active trades for chart overlay
  const { data: activeTrades } = useQuery<Trade[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#1e293b" },
          textColor: "#e2e8f0",
        },
        grid: {
          vertLines: { color: "#334155" },
          horzLines: { color: "#334155" },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "#10b981",
            width: 1,
            style: 2,
          },
          horzLine: {
            color: "#10b981",
            width: 1,
            style: 2,
          },
        },
        rightPriceScale: {
          borderColor: "#334155",
          textColor: "#e2e8f0",
        },
        timeScale: {
          borderColor: "#334155",
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: fullscreen ? window.innerHeight - 100 : height,
      });

      // Add candlestick series
      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#10b981",
        wickDownColor: "#ef4444",
        wickUpColor: "#10b981",
      });

      // Add volume series  
      const volumeSeries = (chart as any).addHistogramSeries({
        color: "#64748b",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;
      setIsChartReady(true);

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: fullscreen ? window.innerHeight - 100 : height,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        // Clear trade lines
        tradeLinesRef.current.forEach(line => {
          try {
            (chart as any).removePriceLine(line);
          } catch (e) {
            // Ignore removal errors
          }
        });
        tradeLinesRef.current = [];
        
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error("Error initializing chart:", error);
    }
  }, [height, fullscreen]);

  // Update chart data
  useEffect(() => {
    if (!isChartReady || !candleData || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    try {
      const formattedData = candleData.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      const volumeData = candleData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? "#10b98160" : "#ef444460",
      }));

      candlestickSeriesRef.current.setData(formattedData);
      volumeSeriesRef.current.setData(volumeData);

      // Auto-scale to fit data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [candleData, isChartReady]);

  // Update trade lines on chart
  useEffect(() => {
    if (!chartRef.current || !activeTrades || !isChartReady) {
      return;
    }

    try {
      // Clear existing trade lines
      tradeLinesRef.current.forEach(line => {
        try {
          (chartRef.current as any).removePriceLine(line);
        } catch (e) {
          // Ignore removal errors
        }
      });
      tradeLinesRef.current = [];

      // Add trade lines for each active trade
      activeTrades.forEach(trade => {
        if (trade.status !== 'active') return;

        const entryPrice = parseFloat(trade.entryPrice || "0");
        const tp1 = parseFloat(trade.tp1);
        const tp2 = parseFloat(trade.tp2);
        const sl = parseFloat(trade.sl);

        // Entry price line (white)
        const entryLine = (chartRef.current as any).createPriceLine({
          price: entryPrice,
          color: '#ffffff',
          lineWidth: 2,
          lineStyle: 0, // solid
          axisLabelVisible: true,
          title: `Entry: ${entryPrice.toFixed(2)}`,
        });
        tradeLinesRef.current.push(entryLine);

        // TP1 line (green)
        const tp1Line = (chartRef.current as any).createPriceLine({
          price: tp1,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: `TP1: ${tp1.toFixed(2)}`,
        });
        tradeLinesRef.current.push(tp1Line);

        // TP2 line (emerald)
        const tp2Line = (chartRef.current as any).createPriceLine({
          price: tp2,
          color: '#34d399',
          lineWidth: 2,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: `TP2: ${tp2.toFixed(2)}`,
        });
        tradeLinesRef.current.push(tp2Line);

        // Stop loss line (red)
        const slLine = (chartRef.current as any).createPriceLine({
          price: sl,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: `SL: ${sl.toFixed(2)}`,
        });
        tradeLinesRef.current.push(slLine);
      });
    } catch (error) {
      console.error("Error updating trade lines:", error);
    }
  }, [activeTrades, isChartReady]);

  const timeframes = [
    { label: "1M", value: "M1" },
    { label: "5M", value: "M5" },
    { label: "15M", value: "M15" },
    { label: "1H", value: "H1" },
    { label: "4H", value: "H4" },
    { label: "1D", value: "D" },
  ];

  if (error) {
    return (
      <Card className="bg-slate-800 p-6 rounded-xl border-slate-700">
        <div className="text-red-400 text-center">
          <BarChart3 className="mx-auto mb-2" size={32} />
          <div>Failed to load chart data</div>
          <div className="text-sm text-slate-500 mt-1">
            Please check your connection and try again
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800 border-slate-700 ${fullscreen ? "fixed inset-4 z-50" : "rounded-xl"}`}>
      {/* Chart Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-emerald-500" size={20} />
            <span className="font-semibold text-lg">XAU/USD</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant="ghost"
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 text-xs ${
                  timeframe === tf.value
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="p-2 text-slate-400 hover:text-slate-200"
          >
            <Maximize2 size={16} />
          </Button>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800 bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              <div className="text-sm text-slate-400">Loading chart data...</div>
            </div>
          </div>
        )}
        
        {!isLoading && !candleData && (
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton className="w-full h-full" />
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ height: fullscreen ? window.innerHeight - 100 : height }}
        />
      </div>

      {/* Chart Footer */}
      <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <span>Real-time OANDA data</span>
            <span>•</span>
            <span>{candleData?.length || 0} candles</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Live</span>
          </div>
        </div>
        
        {/* Trade Lines Legend */}
        {activeTrades && activeTrades.length > 0 && (
          <div className="flex items-center space-x-6 text-xs">
            <span className="text-slate-300">Trade Lines:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-white"></div>
              <span>Entry</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-emerald-500 border-dashed border-t border-emerald-500"></div>
              <span>TP1</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-emerald-400 border-dashed border-t border-emerald-400"></div>
              <span>TP2</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-red-500 border-dashed border-t border-red-500"></div>
              <span>Stop Loss</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}