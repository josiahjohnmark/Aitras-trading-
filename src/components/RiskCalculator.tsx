import React, { useState, useEffect } from "react";
import { Coins, HelpCircle, ShieldCheck, TrendingUp, TrendingDown, RefreshCw, Bookmark, AlertTriangle } from "lucide-react";

interface RiskCalculatorProps {
  accountBalance: number;
  setAccountBalance: (val: number) => void;
  riskPercentage: number;
  setRiskPercentage: (val: number) => void;
  currentPair: string;
  onLogTrade: (trade: {
    pair: string;
    type: "BUY" | "SELL";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskToReward: number;
    confidenceScore: number;
    lotSize: number;
    riskAmount: number;
  }) => void;
}

const FOREX_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];

export default function RiskCalculator({
  accountBalance,
  setAccountBalance,
  riskPercentage,
  setRiskPercentage,
  currentPair: initialPair,
  onLogTrade
}: RiskCalculatorProps) {
  const [selectedPair, setSelectedPair] = useState<string>(initialPair || "EURUSD");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState<number>(1.0850);
  const [stopLoss, setStopLoss] = useState<number>(1.0820);
  const [takeProfit, setTakeProfit] = useState<number>(1.0940);
  const [confidenceScore, setConfidenceScore] = useState<number>(85);
  const [isLogged, setIsLogged] = useState<boolean>(false);

  // Sync entry prices when changing pair to realistic starting points
  useEffect(() => {
    if (selectedPair === "EURUSD") {
      setEntryPrice(1.0850);
      setStopLoss(1.0820);
      setTakeProfit(1.0940);
    } else if (selectedPair === "GBPUSD") {
      setEntryPrice(1.2720);
      setStopLoss(1.2680);
      setTakeProfit(1.2840);
    } else if (selectedPair === "USDJPY") {
      setEntryPrice(155.40);
      setStopLoss(155.00);
      setTakeProfit(156.60);
    } else if (selectedPair === "XAUUSD") {
      setEntryPrice(2350.00);
      setStopLoss(2342.00);
      setTakeProfit(2374.00);
    }
    setIsLogged(false);
  }, [selectedPair]);

  // Reset log status when parameters change
  useEffect(() => {
    setIsLogged(false);
  }, [entryPrice, stopLoss, takeProfit, tradeType, accountBalance, riskPercentage]);

  // Calculations
  const riskAmount = parseFloat(((accountBalance * riskPercentage) / 100).toFixed(2));
  const priceDiff = Math.abs(entryPrice - stopLoss);
  
  let pipsDiff = 0;
  let lotSize = 0;

  if (selectedPair.includes("JPY")) {
    pipsDiff = priceDiff; // For JPY, 1.00 is 100 pips
    const pips = priceDiff * 100;
    lotSize = pips > 0 ? riskAmount / (pips * 10) : 0;
    pipsDiff = parseFloat((priceDiff * 100).toFixed(1));
  } else if (selectedPair === "XAUUSD") {
    lotSize = priceDiff > 0 ? riskAmount / (priceDiff * 100) : 0;
    pipsDiff = parseFloat((priceDiff * 10).toFixed(1)); // Gold points/pips
  } else {
    const pips = priceDiff * 10000;
    lotSize = pips > 0 ? riskAmount / (pips * 10) : 0;
    pipsDiff = parseFloat((priceDiff * 10000).toFixed(1));
  }

  const finalLotSize = parseFloat(Math.max(0.01, lotSize).toFixed(2));
  
  const tpDiff = Math.abs(takeProfit - entryPrice);
  let rrRatio = priceDiff > 0 ? parseFloat((tpDiff / priceDiff).toFixed(2)) : 0;
  if (rrRatio < 0.1) rrRatio = 3.5; // fallback

  const potentialReward = parseFloat((riskAmount * rrRatio).toFixed(2));

  const handleCalculateLog = () => {
    onLogTrade({
      pair: selectedPair,
      type: tradeType,
      entryPrice,
      stopLoss,
      takeProfit,
      riskToReward: rrRatio,
      confidenceScore,
      lotSize: finalLotSize,
      riskAmount
    });
    setIsLogged(true);
  };

  return (
    <div id="risk-calculator-view" className="space-y-6 fade-in max-w-4xl mx-auto w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-5">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-500" />
            Institutional Risk & Position Sizer
          </h1>
          <p className="text-xs text-text-sub mt-1.5 leading-relaxed font-semibold">
            Calculate precise CFTC compliant contract sizes, lot allocations, and risk-to-reward metrics based on your strategic account parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-xs bg-card-bg">
            <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider border-b border-border-custom pb-3 mb-4 flex items-center gap-2">
              <span className="p-1 bg-blue-500/15 rounded text-blue-500">1</span>
              Account & Asset Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Balance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Account Balance (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-sub">$</span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full font-mono text-xs border border-border-custom rounded-xl pl-7 pr-3 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                  />
                </div>
              </div>

              {/* Risk Percentage */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Risk Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="15"
                    step="0.1"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(Number(e.target.value))}
                    className="w-full font-mono text-xs border border-border-custom rounded-xl pl-3 pr-8 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-sub">%</span>
                </div>
              </div>

              {/* Trading Asset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Selected Asset</label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full font-sans text-xs border border-border-custom rounded-xl px-3 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                >
                  {FOREX_PAIRS.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-xs bg-card-bg">
            <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider border-b border-border-custom pb-3 mb-4 flex items-center gap-2">
              <span className="p-1 bg-blue-500/15 rounded text-blue-500">2</span>
              Trade Parameters
            </h3>

            {/* Trade Type Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setTradeType("BUY")}
                className={`py-3.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  tradeType === "BUY"
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60 shadow-inner"
                    : "bg-input-bg text-text-sub border-border-custom hover:text-text-main"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                LONG / BUY SETUP
              </button>
              <button
                type="button"
                onClick={() => setTradeType("SELL")}
                className={`py-3.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  tradeType === "SELL"
                    ? "bg-rose-950/40 text-rose-400 border-rose-900/60 shadow-inner"
                    : "bg-input-bg text-text-sub border-border-custom hover:text-text-main"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                SHORT / SELL SETUP
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Entry Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Entry Price</label>
                <input
                  type="number"
                  step="0.0001"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-xs border border-border-custom rounded-xl px-3 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                />
              </div>

              {/* Stop Loss */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Stop Loss</label>
                <input
                  type="number"
                  step="0.0001"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-xs border border-border-custom rounded-xl px-3 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                />
              </div>

              {/* Take Profit */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">Take Profit</label>
                <input
                  type="number"
                  step="0.0001"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-xs border border-border-custom rounded-xl px-3 py-2.5 text-text-main focus:outline-none focus:border-blue-500 bg-input-bg font-bold"
                />
              </div>
            </div>

            {/* Confidence slider */}
            <div className="mt-5 pt-4 border-t border-border-custom">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-extrabold text-text-sub uppercase">SMC / ICT Confluence Confidence</label>
                <span className="font-mono text-xs font-bold text-blue-500">{confidenceScore}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-text-sub uppercase mt-1">
                <span>Moderate Confluence</span>
                <span>Institutional Grade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Sizing Output */}
        <div className="space-y-6">
          <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-sm bg-[#0B0F19] text-white flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider border-b border-[#1E293B] pb-3 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Risk Calculations Profile
              </h3>

              <div className="space-y-4">
                {/* Lot Size Metric */}
                <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-4 text-center">
                  <span className="text-[9px] font-extrabold text-text-sub uppercase block mb-1">Recommended Contract Size</span>
                  <div className="text-3xl font-bold font-mono text-blue-500 tracking-tight">
                    {finalLotSize} <span className="text-sm font-semibold text-text-sub font-sans">Lots</span>
                  </div>
                  <span className="text-[9px] text-[#64748B] font-semibold block mt-1.5 font-sans">
                    Based on {pipsDiff} pips of invalidation room.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Total Risk */}
                  <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-3.5 text-center">
                    <span className="text-[9px] font-extrabold text-text-sub uppercase block mb-1">Max Capital Risk</span>
                    <div className="text-lg font-bold font-mono text-rose-500">${riskAmount.toLocaleString()}</div>
                    <span className="text-[8px] text-[#64748B] font-semibold mt-1 block">{riskPercentage}% of Account</span>
                  </div>

                  {/* Potential Profit */}
                  <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-3.5 text-center">
                    <span className="text-[9px] font-extrabold text-text-sub uppercase block mb-1">Profit Objective</span>
                    <div className="text-lg font-bold font-mono text-emerald-500">${potentialReward.toLocaleString()}</div>
                    <span className="text-[8px] text-[#64748B] font-semibold mt-1 block">R:R Ratio 1:{rrRatio}</span>
                  </div>
                </div>

                {/* Validation Warnings */}
                {tradeType === "BUY" && entryPrice <= stopLoss && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex gap-2 items-start text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Error:</strong> For long trades, your stop loss price must be below the entry price!</span>
                  </div>
                )}
                {tradeType === "SELL" && entryPrice >= stopLoss && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex gap-2 items-start text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Error:</strong> For short trades, your stop loss price must be above the entry price!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B]">
              {isLogged ? (
                <div className="w-full text-center py-3 bg-emerald-950/50 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-900/40">
                  ✓ Setup Simulated & Journaled Successfully
                </div>
              ) : (
                <button
                  onClick={handleCalculateLog}
                  disabled={(tradeType === "BUY" && entryPrice <= stopLoss) || (tradeType === "SELL" && entryPrice >= stopLoss)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-bold text-xs text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  LOG SIMULATED TRADE TO JOURNAL
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
