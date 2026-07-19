import React, { useEffect, useRef, useState } from "react";
import { MarketThesis, TechnicalZone, SwingPoint } from "../types";
import ChartContainer from "./ChartContainer";
import { 
  Loader2, 
  Sparkles, 
  Play, 
  Activity, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Cpu,
  BarChart2,
  DollarSign
} from "lucide-react";

// The 14 official real-time stages of the AITRAS Core Analysis Engine
const PIPELINE_STEPS = [
  { label: "Collect live market data", desc: "Streaming live tick pricing and orderbook metrics." },
  { label: "Load historical AI memory", desc: "Accessing previous audit registers and memory buffers." },
  { label: "Multi-timeframe analysis", desc: "Syncing higher-tf trend narratives down to the execution scale." },
  { label: "Market structure investigation", desc: "Searching for major structural peaks, valleys, BOS, and MSS shifts." },
  { label: "Liquidity investigation", desc: "Plotting pools of resting buy-side/sell-side liquidity." },
  { label: "Order Block detection", desc: "Pinpointing active institutional volume demand/supply blocks." },
  { label: "Fair Value Gaps detection", desc: "Measuring delivery inefficiencies and open price imbalances." },
  { label: "Confluence evaluation", desc: "Combining indicator outputs for mathematical validation score." },
  { label: "Economic news investigation", desc: "Checking macroeconomic calendars for immediate event drivers." },
  { label: "Historical pattern comparison", desc: "Evaluating cycle correlations and historical pattern fractals." },
  { label: "Market thesis generation", desc: "Drafting directional bias via Chief Analyst reasoning models." },
  { label: "Risk assessment", desc: "Calculating invalidation thresholds, optimal SL placement, and sizing parameters." },
  { label: "Final investigation report", desc: "Publishing complete digital high-integrity thesis report." },
  { label: "Save investigation parameters", desc: "Archiving structural parameters to AITRAS memory registers." }
];

interface SMCTerminalProps {
  currentPair: string;
  currentTimeframe: string;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (tf: string) => void;
  candles: any[];
  zones: TechnicalZone[];
  swingPoints: SwingPoint[];
  thesis: MarketThesis | null;
  loadingAnalysis: boolean;
  onTriggerAnalysis: () => void;
  onLogTrade: (trade: any) => void;
  oandaDetails?: any;
}

export default function SMCTerminal({
  currentPair,
  currentTimeframe,
  candles,
  zones,
  swingPoints,
  thesis,
  loadingAnalysis,
  onPairChange,
  onTimeframeChange,
  onTriggerAnalysis,
  onLogTrade,
  oandaDetails,
}: SMCTerminalProps) {
  const [selectedZone, setSelectedZone] = useState<TechnicalZone | null>(null);
  const [riskPercentage, setRiskPercentage] = useState<number>(1); // default 1% risk
  const [accountBalance, setAccountBalance] = useState<number>(100000); // default $100k
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [localOandaDetails, setLocalOandaDetails] = useState<any>(oandaDetails);
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    reason: string;
    activeSessions: string[];
    utcTime?: string;
    localTime?: string;
  } | null>(null);

  // Real-time EventSource states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<Array<{ label: string; desc: string; status: "waiting" | "running" | "completed" }>>(
    PIPELINE_STEPS.map(s => ({ ...s, status: "waiting" }))
  );

  // Active formulated thesis state
  const [activeThesis, setActiveThesis] = useState<MarketThesis | null>(null);
  const [aiDrawings, setAiDrawings] = useState<any[]>([]);

  const forexPairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];
  const timeframes = ["M5", "M15", "H1", "H4", "D1"];

  const fetchedDataRef = useRef<any>(null);

  // Load previous thesis from cache or memory when pair or timeframe changes
  useEffect(() => {
    setIsLogged(false);
    setActiveThesis(null);
    setAiDrawings([]);
    
    fetch(`/api/memory?key=thesis_${currentPair}_${currentTimeframe}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          setActiveThesis(parsed);
          if (parsed.suggestedTrade) {
            setAiDrawings([
              { type: "ENTRY", price: parsed.suggestedTrade.entry, label: "AI Suggested Entry" },
              { type: "STOP_LOSS", price: parsed.suggestedTrade.stopLoss, label: "AI Stop Loss" },
              { type: "TAKE_PROFIT", price: parsed.suggestedTrade.takeProfit, label: "AI Take Profit" }
            ]);
          }
        }
      })
      .catch(e => console.log("No previous thesis found in terminal cache:", e));
  }, [currentPair, currentTimeframe]);

  // Simulate live price ticks when market is open
  useEffect(() => {
    if (!candles || candles.length === 0) return;
    
    const updateTick = () => {
      const lastCandle = candles[candles.length - 1];
      const basePrice = lastCandle.close;
      
      const pipMultiplier = currentPair.includes("JPY") ? 0.01 : currentPair === "XAUUSD" ? 0.1 : 0.0001;
      const spreadPips = currentPair === "XAUUSD" ? 0.4 : currentPair.includes("JPY") ? 1.5 : 1.2;
      
      const isMarketOpen = marketStatus?.isOpen !== false;
      const fluctuation = isMarketOpen ? (Math.random() - 0.5) * 2 * pipMultiplier : 0;
      
      const midPrice = basePrice + fluctuation;
      const bid = midPrice - (spreadPips / 2) * pipMultiplier;
      const ask = midPrice + (spreadPips / 2) * pipMultiplier;
      
      setLocalOandaDetails({
        source: isMarketOpen ? "OANDA Live Connection" : "OANDA Historical Archive",
        bid: parseFloat(bid.toFixed(currentPair.includes("JPY") ? 2 : 5)),
        ask: parseFloat(ask.toFixed(currentPair.includes("JPY") ? 2 : 5)),
        spread: spreadPips * pipMultiplier,
        volume: lastCandle.volume + Math.floor(Math.random() * 15)
      });
    };

    updateTick();
    
    const interval = setInterval(() => {
      if (marketStatus?.isOpen !== false) {
        updateTick();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [candles, currentPair, marketStatus]);

  useEffect(() => {
    fetch("/api/market/status")
      .then(res => res.json())
      .then(data => setMarketStatus(data))
      .catch(e => console.error("Failed to load market status:", e));
  }, []);

  const handleStartInvestigation = () => {
    setIsAnalyzing(true);
    setActiveThesis(null);
    setAiDrawings([]);
    fetchedDataRef.current = null;

    fetch("/api/market/status")
      .then(res => res.json())
      .then(data => setMarketStatus(data))
      .catch(e => console.error("Failed to update market status:", e));
    
    setSteps(PIPELINE_STEPS.map((s, index) => ({
      ...s,
      status: index === 0 ? "running" : "waiting"
    })));
    setCurrentStepIndex(0);

    const eventSource = new EventSource(`/api/analysis/investigate-stream?pair=${currentPair}&timeframe=${currentTimeframe}&confluences=ob,fvg,choch,mss,liquidity,bb,premium_discount,ote`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error("Investigation stream error:", data.error);
          eventSource.close();
          setIsAnalyzing(false);
          return;
        }

        const { stepIndex, status, details, thesis, finished } = data;

        setCurrentStepIndex(stepIndex);
        setSteps(prev => prev.map((step, idx) => {
          if (idx < stepIndex) {
            return { ...step, status: "completed" };
          } else if (idx === stepIndex) {
            return { ...step, status: status === "completed" ? "completed" : "running", desc: details };
          } else {
            return { ...step, status: "waiting" };
          }
        }));

        if (thesis) {
          if (data.oandaDetails) {
            setLocalOandaDetails(data.oandaDetails);
          }
          setActiveThesis(thesis);
          if (thesis.suggestedTrade) {
            setAiDrawings([
              { type: "ENTRY", price: thesis.suggestedTrade.entry, label: "AI Suggested Entry" },
              { type: "STOP_LOSS", price: thesis.suggestedTrade.stopLoss, label: "AI Stop Loss" },
              { type: "TAKE_PROFIT", price: thesis.suggestedTrade.takeProfit, label: "AI Take Profit" }
            ]);
          }
          onTriggerAnalysis();
        }

        if (finished) {
          eventSource.close();
          setIsAnalyzing(false);
        }
      } catch (err) {
        console.error("Failed to parse stream event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed connection:", err);
      eventSource.close();
      setIsAnalyzing(false);
    };
  };

  const calculatePositionSizing = () => {
    const trade = activeThesis?.suggestedTrade;
    if (!trade) return { lotSize: 0, totalRisk: 0, rewardAmount: 0 };

    const entry = trade.entry;
    const sl = trade.stopLoss;

    const priceDiff = Math.abs(entry - sl);
    const totalRiskAmount = (accountBalance * riskPercentage) / 100;

    let lotSize = 0;
    if (currentPair.includes("JPY")) {
      const pips = priceDiff * 100;
      lotSize = pips > 0 ? totalRiskAmount / (pips * 10) : 0;
    } else if (currentPair === "XAUUSD") {
      lotSize = priceDiff > 0 ? totalRiskAmount / (priceDiff * 100) : 0;
    } else {
      const pips = priceDiff * 10000;
      lotSize = pips > 0 ? totalRiskAmount / (pips * 10) : 0;
    }

    return {
      lotSize: parseFloat(Math.max(0.01, lotSize).toFixed(2)),
      totalRisk: totalRiskAmount,
      rewardAmount: totalRiskAmount * trade.riskToReward
    };
  };

  const handleExecute = () => {
    if (!activeThesis || !activeThesis.suggestedTrade) return;
    const sizingResult = calculatePositionSizing();
    onLogTrade({
      pair: currentPair,
      type: activeThesis.suggestedTrade.type,
      entryPrice: activeThesis.suggestedTrade.entry,
      stopLoss: activeThesis.suggestedTrade.stopLoss,
      takeProfit: activeThesis.suggestedTrade.takeProfit,
      riskToReward: activeThesis.suggestedTrade.riskToReward,
      confidenceScore: activeThesis.confidenceScore,
      lotSize: sizingResult.lotSize,
      riskAmount: sizingResult.totalRisk
    });
    setIsLogged(true);
  };

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 1.0850;
  const sizing = calculatePositionSizing();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full text-text-main font-sans transition-colors duration-200 overflow-hidden">
      
      {/* Left panel - Terminal controls */}
      <aside className="w-80 border-r border-border-custom bg-sidebar-bg flex flex-col p-4.5 shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <Sliders className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">TERMINAL ENGINE</span>
          </div>

          {/* Instrument picker */}
          <div>
            <span className="text-[9px] font-extrabold text-text-sub uppercase tracking-wider block mb-1.5">TRADING ASSET</span>
            <div className="grid grid-cols-2 gap-1.5">
              {forexPairs.map((pair) => (
                <button
                  key={pair}
                  disabled={isAnalyzing}
                  onClick={() => onPairChange(pair)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border text-center cursor-pointer ${
                    currentPair === pair 
                      ? "bg-blue-600 text-white border-blue-500 shadow-xs" 
                      : "bg-input-bg text-text-sub border-border-custom hover:text-text-main hover:bg-border-color"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe picker */}
          <div>
            <span className="text-[9px] font-extrabold text-text-sub uppercase tracking-wider block mb-1.5">TIMEFRAME</span>
            <div className="grid grid-cols-5 gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  disabled={isAnalyzing}
                  onClick={() => onTimeframeChange(tf)}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all border text-center cursor-pointer ${
                    currentTimeframe === tf 
                      ? "bg-blue-600 text-white border-blue-500 shadow-xs" 
                      : "bg-input-bg text-text-sub border-border-custom hover:text-text-main hover:bg-border-color"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* AITRAS Decision Engine Trigger */}
          <div className="border-t border-border-custom pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2">Decision Launcher</h3>
            <button
              onClick={handleStartInvestigation}
              disabled={isAnalyzing}
              className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isAnalyzing 
                  ? "bg-indigo-600 animate-pulse" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                  <span>INVESTIGATING...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>START INVESTIGATION</span>
                </>
              )}
            </button>

            {/* Pipeline progress */}
            {isAnalyzing && (
              <div className="mt-3 bg-input-bg p-3 border border-border-custom rounded-xl transition-all duration-200">
                <div className="flex justify-between text-[8px] font-bold text-text-sub mb-1">
                  <span>PIPELINE PROGRESS</span>
                  <span>Stage {currentStepIndex + 1}/14</span>
                </div>
                <div className="w-full h-1 bg-border-custom rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / 14) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-extrabold text-blue-500 animate-pulse mt-1.5 truncate">
                  &gt; {steps[currentStepIndex]?.label}...
                </p>
                <p className="text-[8px] text-text-sub italic mt-0.5 line-clamp-2">
                  {steps[currentStepIndex]?.desc}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Terminal Frame (Chart + Right Stats side-by-side) */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-app-bg">
        
        {/* Interactive Live Chart area */}
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto min-w-0">
          <div className="bento-card border border-border-custom rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="px-5 py-3.5 border-b border-border-custom flex items-center justify-between bg-input-bg/40">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-text-main">
                  Tactical Chart Terminal: {currentPair} ({currentTimeframe})
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-sub">SMC Confluence Mapping</span>
            </div>
            
            <div className="flex-1 relative min-h-0 w-full bg-[#090D16]">
              <ChartContainer
                candles={candles}
                zones={zones}
                swingPoints={swingPoints}
                currentPrice={currentPrice}
                equilibrium={activeThesis ? activeThesis.keyLevels.equilibrium : currentPrice}
                premiumBoundary={activeThesis ? activeThesis.keyLevels.premiumBoundary : currentPrice + 0.01}
                discountBoundary={activeThesis ? activeThesis.keyLevels.discountBoundary : currentPrice - 0.01}
                suggestedTrade={activeThesis?.suggestedTrade ? activeThesis.suggestedTrade : undefined}
                onSelectZone={(z) => setSelectedZone(z)}
                pair={currentPair}
                timeframe={currentTimeframe}
                aiDrawings={aiDrawings}
              />
            </div>
          </div>

          {/* Active specifications details */}
          {selectedZone && (
            <div className="bento-card text-[#F8FAFC] p-4.5 rounded-2xl border border-border-custom shadow-sm flex items-start gap-4 fade-in">
              <div className={`p-2.5 rounded-xl ${
                selectedZone.subType?.includes("bullish") || selectedZone.subType?.includes("buy_side") 
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}>
                <Coins className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Active {selectedZone.type.replace("_", " ")} Specifications
                </h4>
                <p className="text-sm font-bold text-text-main mt-1">
                  Range: <span className="font-mono text-slate-650">{(selectedZone.priceStart || 0).toFixed(5)} - {(selectedZone.priceEnd || 0).toFixed(5)}</span>
                </p>
                <p className="text-xs text-text-sub mt-1 leading-relaxed">
                  Our {selectedZone.timeframe} confluence engine computed this zone as an institutional liquidity level with computed confidence rating of{" "}
                  <span className="text-emerald-600 font-bold">{selectedZone.confidence}%</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Tactical widgets */}
        <div className="w-80 border-l border-border-custom bg-sidebar-bg flex flex-col p-4.5 overflow-y-auto shrink-0 gap-4">
          
          {/* AI Analysis Panel */}
          <div className="bento-card border border-[#1E293B] shadow-3xs rounded-2xl p-4.5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F8FAFC]">AI THESIS METRICS</span>
              <span className="text-[10px] text-[#64748B] font-bold">Cockpit Insights</span>
            </div>

            {activeThesis ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Bias</span>
                      <span className={`text-sm font-black tracking-wide uppercase ${
                        activeThesis.bias === "BULLISH" 
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-max" 
                          : activeThesis.bias === "BEARISH"
                          ? "text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md w-max"
                          : "text-[#94A3B8] bg-[#0B0F19] border border-[#1E293B] px-2 py-0.5 rounded-md w-max"
                      }`}>
                        {activeThesis.bias}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Confidence</span>
                      <span className="text-[11px] font-extrabold text-[#F8FAFC]">
                        {activeThesis.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  {/* Confluence Gauge */}
                  <div className="flex flex-col items-center justify-center p-2 bg-[#0B0F19] border border-[#1E293B] rounded-xl">
                    <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest mb-1">Confluence</span>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="18" className="stroke-slate-200" strokeWidth="4" fill="transparent" />
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke={activeThesis.confidenceScore >= 70 ? "#10b981" : activeThesis.confidenceScore >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={(2 * Math.PI * 18) - (activeThesis.confidenceScore / 100) * (2 * Math.PI * 18)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[11px] font-black text-[#F8FAFC] leading-none">{activeThesis.confidenceScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valuations */}
                <div className="border-t border-[#1E293B] pt-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Dealing Range</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold">
                    <div className="bg-[#0B0F19] p-1.5 rounded-lg border border-[#1E293B]">
                      <span className="text-slate-450 block text-[7px] uppercase">Premium</span>
                      <span className="font-mono text-rose-600 font-extrabold">{activeThesis.keyLevels.premiumBoundary.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                    </div>
                    <div className="bg-[#0B0F19] p-1.5 rounded-lg border border-[#1E293B]">
                      <span className="text-slate-450 block text-[7px] uppercase font-mono">Eq</span>
                      <span className="font-mono text-[#94A3B8] font-extrabold">{activeThesis.keyLevels.equilibrium.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                    </div>
                    <div className="bg-[#0B0F19] p-1.5 rounded-lg border border-[#1E293B]">
                      <span className="text-slate-450 block text-[7px] uppercase">Discount</span>
                      <span className="font-mono text-emerald-600 font-extrabold">{activeThesis.keyLevels.discountBoundary.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                    </div>
                  </div>
                </div>

                {/* Targets */}
                {activeThesis.suggestedTrade ? (
                  <div className="border-t border-[#1E293B] pt-2 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Suggested Setup Targets</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold">
                      <div className="bg-[#0B0F19] p-2 rounded-lg border border-[#1E293B] flex flex-col gap-0.5">
                        <span className="text-[#64748B] text-[7px] uppercase">Entry</span>
                        <span className="font-mono font-black text-[#F8FAFC]">{activeThesis.suggestedTrade.entry.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                      </div>
                      <div className="bg-[#0B0F19] p-2 rounded-lg border border-[#1E293B] flex flex-col gap-0.5">
                        <span className="text-[#64748B] text-[7px] uppercase">SL</span>
                        <span className="font-mono font-black text-rose-600">{activeThesis.suggestedTrade.stopLoss.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                      </div>
                      <div className="bg-[#0B0F19] p-2 rounded-lg border border-[#1E293B] flex flex-col gap-0.5">
                        <span className="text-[#64748B] text-[7px] uppercase">TP</span>
                        <span className="font-mono font-black text-emerald-600">{activeThesis.suggestedTrade.takeProfit.toFixed(currentPair.includes("JPY") ? 2 : 5)}</span>
                      </div>
                      <div className="bg-[#0B0F19] p-2 rounded-lg border border-[#1E293B] flex flex-col gap-0.5">
                        <span className="text-[#64748B] text-[7px] uppercase">R:R</span>
                        <span className="font-mono font-black text-blue-600">1 : {activeThesis.suggestedTrade.riskToReward.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-[#1E293B] pt-2 text-[9px] text-[#64748B] italic text-center py-1">
                    No setups suggested. Stand aside.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-[10px] text-[#64748B] italic">
                Awaiting formulated market study. Launch investigation.
              </div>
            )}
          </div>

          {/* OANDA Live Stream */}
          <div className="bento-card text-[#F8FAFC] border border-[#1E293B] rounded-2xl p-4.5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">OANDA MARKET LIVE</span>
              </div>
            </div>

            {marketStatus && (
              <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${
                marketStatus.isOpen ? "bg-emerald-50/10 border-emerald-500/20 text-emerald-500" : "bg-rose-50/10 border-rose-500/20 text-rose-500"
              }`}>
                <div className="flex items-center justify-between text-[8px] font-extrabold uppercase">
                  <span>Forex System:</span>
                  <span>{marketStatus.isOpen ? "LIVE" : "CLOSED"}</span>
                </div>
                <span className="text-[9px] font-bold">{marketStatus.reason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-lg p-2 text-center flex flex-col">
                <span className="text-[7px] font-bold text-[#64748B] uppercase">BID</span>
                <span className="text-xs font-mono font-extrabold text-emerald-500">
                  {localOandaDetails?.bid || "1.08502"}
                </span>
              </div>
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-lg p-2 text-center flex flex-col">
                <span className="text-[7px] font-bold text-[#64748B] uppercase">ASK</span>
                <span className="text-xs font-mono font-extrabold text-rose-500">
                  {localOandaDetails?.ask || "1.08518"}
                </span>
              </div>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-lg p-2.5 flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#64748B] text-[8px]">SPREAD:</span>
              <span className="text-emerald-500 font-extrabold">
                {localOandaDetails?.spread !== undefined
                  ? `${(localOandaDetails.spread * (currentPair.includes("JPY") ? 100 : 10000)).toFixed(1)} pips`
                  : "1.2 pips"}
              </span>
            </div>
          </div>

          {/* Position Sizer Card */}
          {activeThesis?.suggestedTrade && (
            <div className="bento-card border border-[#1E293B] rounded-2xl p-4.5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Position Calculator</span>
                <span className="text-[8px] font-bold bg-blue-600/10 text-blue-500 px-1.5 py-0.5 rounded">
                  {activeThesis.suggestedTrade.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-bold text-[#64748B] uppercase">Balance</span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="font-mono text-[10px] border border-[#334155] rounded-md px-2 py-1 text-[#F8FAFC] bg-[#0B0F19]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-bold text-[#64748B] uppercase">Risk %</span>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(Number(e.target.value))}
                    className="font-mono text-[10px] border border-[#334155] rounded-md px-2 py-1 text-[#F8FAFC] bg-[#0B0F19]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-[#0B0F19] border border-[#1E293B] p-2 rounded-lg font-mono text-center text-[10px]">
                <div className="flex flex-col">
                  <span className="text-[6px] font-bold text-[#64748B] uppercase">Lots</span>
                  <span className="text-xs font-extrabold text-blue-500">{sizing.lotSize}</span>
                </div>
                <div className="flex flex-col border-x border-slate-150">
                  <span className="text-[6px] font-bold text-[#64748B] uppercase">Risk</span>
                  <span className="text-[9px] font-bold text-rose-500">${sizing.totalRisk.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] font-bold text-[#64748B] uppercase">Reward</span>
                  <span className="text-[9px] font-bold text-emerald-500">${sizing.rewardAmount.toFixed(1)}</span>
                </div>
              </div>

              {isLogged ? (
                <div className="w-full text-center py-1.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-extrabold rounded-lg border border-emerald-500/20">
                  ✓ Setup Saved to Research Journal
                </div>
              ) : (
                <button
                  onClick={handleExecute}
                  className="w-full py-2 px-3 rounded-lg text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
                >
                  Log to Research Journal
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
