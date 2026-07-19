import React, { useEffect, useRef, useState } from "react";
import { TechnicalZone, SwingPoint } from "../types";
import { 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  PenTool, 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Sliders, 
  Navigation, 
  Check, 
  Grid 
} from "lucide-react";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartContainerProps {
  candles: Candle[];
  zones: TechnicalZone[];
  swingPoints: SwingPoint[];
  currentPrice: number;
  equilibrium: number;
  premiumBoundary: number;
  discountBoundary: number;
  suggestedTrade?: {
    type: "BUY" | "SELL";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskToReward: number;
  };
  onSelectZone: (zone: TechnicalZone | null) => void;
  pair: string;
  timeframe: string; // Dynamic Timeframe synchronized from parent
  aiDrawings?: any[]; // Drawn commands received from AI conversation bridge
  onAcceptAIDrawing?: (drawing: any) => void;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function ChartContainer({
  candles,
  zones,
  swingPoints,
  currentPrice,
  equilibrium,
  premiumBoundary,
  discountBoundary,
  suggestedTrade,
  onSelectZone,
  pair,
  timeframe,
  aiDrawings = [],
  onAcceptAIDrawing
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Session state synchronized with the backend AI
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["RSI", "Simple Moving Average"]);
  const [userDrawings, setUserDrawings] = useState<Array<{ id: string; type: string; price: number; label: string; createdAt: string }>>([
    { id: "draw-1", type: "Trendline", price: currentPrice, label: "Ascending Support Trendline", createdAt: new Date().toLocaleTimeString() }
  ]);

  // Support toggling standard indicators
  const availableIndicators = [
    { name: "RSI", desc: "Relative Strength Index (14)" },
    { name: "Simple Moving Average", desc: "MA (50) baseline" },
    { name: "Exponential Moving Average", desc: "EMA (200) trend" },
    { name: "MACD", desc: "Moving Average Convergence Divergence" }
  ];

  const handleToggleIndicator = (indicatorName: string) => {
    setActiveIndicators(prev => {
      const next = prev.includes(indicatorName)
        ? prev.filter(i => i !== indicatorName)
        : [...prev, indicatorName];
      syncChartStateToBackend(pair, timeframe, next, userDrawings);
      return next;
    });
  };

  const handleAddDrawing = (type: string, priceOffset = 0) => {
    const calculatedPrice = currentPrice + priceOffset;
    const newDrawing = {
      id: `usr-draw-${Date.now()}`,
      type,
      price: parseFloat(calculatedPrice.toFixed(pair.includes("JPY") ? 2 : 5)),
      label: `Manual ${type} coordinate`,
      createdAt: new Date().toLocaleTimeString()
    };
    const updatedDrawings = [...userDrawings, newDrawing];
    setUserDrawings(updatedDrawings);
    syncChartStateToBackend(pair, timeframe, activeIndicators, updatedDrawings);
  };

  const handleRemoveDrawing = (id: string) => {
    const updatedDrawings = userDrawings.filter(d => d.id !== id);
    setUserDrawings(updatedDrawings);
    syncChartStateToBackend(pair, timeframe, activeIndicators, updatedDrawings);
  };

  // Map instrument to official TradingView symbol
  const getTradingViewSymbol = (p: string) => {
    switch (p) {
      case "EURUSD":
        return "FX:EURUSD";
      case "GBPUSD":
        return "FX:GBPUSD";
      case "USDJPY":
        return "FX:USDJPY";
      case "XAUUSD":
        return "OANDA:XAUUSD";
      default:
        return `FX:${p}`;
    }
  };

  // Check if TradingView script is loaded
  useEffect(() => {
    let checkCount = 0;
    const interval = setInterval(() => {
      if (window.TradingView) {
        setTradingViewLoaded(true);
        clearInterval(interval);
      } else {
        checkCount++;
        if (checkCount > 50) { // 5 seconds limit
          setError("TradingView script failed to load. Please verify your connection.");
          clearInterval(interval);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize and update the widget when loaded, pair changes, or container size changes
  useEffect(() => {
    if (!tradingViewLoaded || !containerRef.current) return;

    const containerId = "aitras_tv_chart";
    
    // Clear previous contents to prevent duplicate widgets
    containerRef.current.innerHTML = `<div id="${containerId}" class="w-full h-full"></div>`;

    try {
      new window.TradingView.widget({
        autosize: true,
        symbol: getTradingViewSymbol(pair),
        interval: timeframe === "M5" ? "5" : timeframe === "M15" ? "15" : timeframe === "H4" ? "240" : timeframe === "D1" ? "D" : "60",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1", // candlesticks
        locale: "en",
        toolbar_bg: "#f8fafc",
        enable_publishing: false,
        hide_side_toolbar: false, // users can use drawing tools
        allow_symbol_change: true,
        container_id: containerId,
        studies: activeIndicators.map(ind => {
          if (ind === "RSI") return "RSI@tv-basicstudies";
          if (ind === "Simple Moving Average") return "MASimple@tv-basicstudies";
          if (ind === "Exponential Moving Average") return "MAExp@tv-basicstudies";
          if (ind === "MACD") return "MACD@tv-basicstudies";
          return "RSI@tv-basicstudies";
        }),
        drawings_access: {
          type: "black",
          tools: [{ name: "Regression Trend" }]
        },
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates", "side_toolbar_in_popup"]
      });

      // Immediately sync current session state to backend
      syncChartStateToBackend(pair, timeframe, activeIndicators, userDrawings);
    } catch (err) {
      console.error("TradingView initialization error:", err);
      setError("Failed to initialize TradingView widget.");
    }
  }, [tradingViewLoaded, pair, timeframe, activeIndicators.length]);

  // Sync state to backend helper
  const syncChartStateToBackend = async (
    selectedPair: string, 
    selectedTf: string, 
    indicators: string[], 
    drawings: typeof userDrawings
  ) => {
    try {
      await fetch("/api/cockpit/sync-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: selectedPair,
          timeframe: selectedTf,
          currentPrice,
          equilibrium,
          premiumBoundary,
          discountBoundary,
          visibleRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          },
          drawings: [
            ...zones.map(z => ({
              type: z.type,
              subType: z.subType,
              priceStart: z.priceStart,
              priceEnd: z.priceEnd,
              confidence: z.confidence,
              source: "AI_Engine"
            })),
            ...drawings.map(d => ({
              type: d.type,
              subType: "user_annotation",
              priceStart: d.price,
              priceEnd: d.price,
              confidence: 100,
              source: "User"
            }))
          ],
          chartState: {
            theme: "light",
            indicators,
            drawingsCount: drawings.length
          }
        })
      });
    } catch (e) {
      console.warn("Failed to sync chart state to backend:", e);
    }
  };

  const handleAcceptAIPlottedDrawing = (item: any) => {
    const newDrawing = {
      id: `ai-accept-${Date.now()}`,
      type: item.type || "AI Level",
      price: item.price || item.priceStart || currentPrice,
      label: item.label || `AI Plotted Level`,
      createdAt: new Date().toLocaleTimeString()
    };
    const updatedDrawings = [...userDrawings, newDrawing];
    setUserDrawings(updatedDrawings);
    syncChartStateToBackend(pair, timeframe, activeIndicators, updatedDrawings);
    if (onAcceptAIDrawing) {
      onAcceptAIDrawing(item);
    }
  };

  return (
    <div className="flex flex-col bento-card border border-[#1E293B] rounded-2xl shadow-sm overflow-hidden h-[640px] fade-in">
      
      {/* Chart Top bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1E293B] px-4 py-3 bg-[#0B0F19] gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">
            TradingView Live Terminal Session ({pair} · {timeframe})
          </span>
        </div>
        
        {/* State / Architecture Meta Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-blue-700 bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg font-bold">
          <LayoutGrid className="h-3 w-3 animate-spin-slow" />
          <span>Real-Time Session Synced to Backend</span>
        </div>
      </div>

      {/* Main Grid: Chart Frame (Left) & Live Controller Overlay (Right / Header) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Target DOM container for TradingView */}
        <div className="flex-1 relative min-h-[300px]">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bento-card">
              <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
              <h4 className="text-sm font-bold text-[#F8FAFC]">Chart Loading Error</h4>
              <p className="text-xs text-[#94A3B8] max-w-md mt-1">{error}</p>
            </div>
          ) : !tradingViewLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bento-card">
              <Loader2 className="animate-spin h-7 w-7 text-blue-600" />
              <span className="font-sans text-xs font-semibold text-[#94A3B8]">
                Initializing Official TradingView Engine...
              </span>
            </div>
          ) : null}

          {/* Actual TV Container */}
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Live Indicator & Drawing Session Controller Panel */}
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-[#1E293B] bg-[#0B0F19]/50 flex flex-col divide-y divide-slate-100 overflow-y-auto">
          
          {/* Active Indicators Setup */}
          <div className="p-4">
            <h5 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sliders className="h-3 w-3 text-[#94A3B8]" />
              Active Indicators
            </h5>
            <div className="flex flex-col gap-1.5">
              {availableIndicators.map(ind => {
                const isActive = activeIndicators.includes(ind.name);
                return (
                  <button
                    key={ind.name}
                    onClick={() => handleToggleIndicator(ind.name)}
                    className={`flex items-center justify-between text-left p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isActive 
                        ? "bento-card border-blue-100 text-blue-700 shadow-3xs" 
                        : "bg-transparent border-transparent text-[#94A3B8] hover:bg-[#1E293B]"
                    }`}
                  >
                    <span>{ind.name}</span>
                    {isActive ? (
                      <Check className="h-3 w-3 text-blue-600" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drawings & Annotations */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <h5 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="h-3 w-3 text-[#94A3B8]" />
                Session Drawings
              </h5>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAddDrawing("OB_Zone", 0.0010)}
                  className="p-1 hover:bg-slate-200 text-[#94A3B8] rounded-md transition cursor-pointer"
                  title="Draw OB Zone"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Drawings list */}
            {userDrawings.length === 0 ? (
              <p className="text-[10px] text-[#64748B] text-center py-4 bento-card border border-dashed border-[#334155] rounded-lg">
                No active session drawings.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {userDrawings.map(d => (
                  <div key={d.id} className="flex items-center justify-between bento-card p-2 rounded-lg border border-[#1E293B] text-[10px] shadow-3xs">
                    <div className="min-w-0">
                      <p className="font-bold text-[#E2E8F0] truncate">{d.type}</p>
                      <p className="font-mono text-[#64748B]">{d.price}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveDrawing(d.id)}
                      className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quick Draw Tools */}
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <button 
                onClick={() => handleAddDrawing("Trendline", -0.0015)}
                className="py-1.5 px-2 bento-card hover:bg-[#1E293B] border border-[#334155] rounded-lg text-[9px] font-bold text-[#94A3B8] text-center cursor-pointer transition"
              >
                + Trendline
              </button>
              <button 
                onClick={() => handleAddDrawing("FVG_Zone", 0.0005)}
                className="py-1.5 px-2 bento-card hover:bg-[#1E293B] border border-[#334155] rounded-lg text-[9px] font-bold text-[#94A3B8] text-center cursor-pointer transition"
              >
                + FVG Zone
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* AI DRAWING INTERACTION BRIDGE: Fulfills section 5 */}
      {aiDrawings && aiDrawings.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold font-mono">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>AITRAS COGNITIVE DRAWING STREAM PROTOCOL</span>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/20">
              {aiDrawings.length} proposed drawings detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {aiDrawings.map((item, index) => {
              const displayPrice = item.price || item.priceStart;
              return (
                <div key={index} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <div className="min-w-0 flex-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                      item.type === "ENTRY" ? "bg-emerald-500/10 text-emerald-400" : item.type === "STOP_LOSS" ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {item.type || "ZONE"}
                    </span>
                    <span className="font-bold text-slate-200 truncate">{item.label}</span>
                    <p className="font-mono text-[10px] text-[#94A3B8] mt-0.5">Value: {displayPrice}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptAIPlottedDrawing(item)}
                    className="ml-2 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition cursor-pointer shadow-sm"
                  >
                    Accept Plot
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Drawing Pipeline Architecture Preparation Bar */}
      <div className="bg-slate-950 border-t border-slate-900 px-4 py-2 flex flex-wrap items-center justify-between text-[#64748B] font-mono text-[10px] gap-2">
        <div className="flex items-center gap-1.5">
          <PenTool className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-300 font-bold">AI BRIDGE PIPELINE ENABLED</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Active Zones Buffer: <strong className="text-emerald-400">{zones.length}</strong></span>
          <span>Indicator state: <strong className="text-blue-400">{activeIndicators.join(", ")}</strong></span>
          <span>Drawing state: <strong className="text-purple-400">{userDrawings.length} user items</strong></span>
        </div>
      </div>

    </div>
  );
}
