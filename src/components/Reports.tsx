import React, { useState } from "react";
import { TradeRecord } from "../types";
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Target, 
  Activity, 
  Calendar, 
  Download, 
  RefreshCw, 
  BarChart2, 
  Loader2, 
  Cpu, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BookOpen 
} from "lucide-react";

interface ReportsProps {
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  tradeHistory: TradeRecord[];
  loadingReports?: boolean;
  reportsError?: string | null;
}

interface BacktestTrade {
  id: string;
  timestamp: string;
  pair: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  riskToReward: number;
  profitAmount: number;
  status: "WIN" | "LOSS";
  confluenceReason: string;
}

interface BacktestResults {
  metrics: {
    initialBalance: number;
    finalBalance: number;
    netProfit: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    profitFactor: number;
  };
  trades: BacktestTrade[];
  critique: string;
}

export default function Reports({ stats, tradeHistory, loadingReports, reportsError }: ReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState<"performance" | "tradelog" | "backtester">("performance");

  // Backtester parameters
  const [backtestPair, setBacktestPair] = useState<string>("EURUSD");
  const [backtestMode, setBacktestMode] = useState<string>("Standard SMC");
  const [backtestRisk, setBacktestRisk] = useState<number>(1);
  const [backtestBalance, setBacktestBalance] = useState<number>(100000);
  const [backtestPeriods, setBacktestPeriods] = useState<number>(12);

  // Backtest status
  const [backtestLoading, setBacktestLoading] = useState<boolean>(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const handleRunBacktest = () => {
    setBacktestLoading(true);
    setBacktestError(null);

    fetch("/api/backtest/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pair: backtestPair,
        mode: backtestMode,
        riskPercentage: backtestRisk,
        initialBalance: backtestBalance,
        periods: backtestPeriods
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Backtest engine offline or invalid configuration.");
        return res.json();
      })
      .then((data) => {
        setBacktestResults(data);
      })
      .catch((err) => {
        console.error("Backtest Error:", err);
        setBacktestError(err.message || "Failed to execute backtest simulation.");
      })
      .finally(() => {
        setBacktestLoading(false);
      });
  };

  if (loadingReports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Compiling Performance analytics...</p>
      </div>
    );
  }

  if (reportsError) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center text-rose-700 text-xs font-semibold font-sans">
        {reportsError}
      </div>
    );
  }

  // Render Equity Curve (Cumulative Profit Growth) via custom SVG
  const renderEquityCurve = () => {
    if (tradeHistory.length === 0) return null;

    // Build cumulative equity coordinates (chronological order)
    const reversedHistory = [...tradeHistory].reverse();
    let currentEquity = 0;
    const points = [{ x: 0, y: 0, equity: 0 }];

    reversedHistory.forEach((trade, idx) => {
      if (trade.profitAmount) {
        currentEquity += trade.profitAmount;
      }
      points.push({
        x: idx + 1,
        y: currentEquity,
        equity: currentEquity,
      });
    });

    const width = 600;
    const height = 240;
    const padding = 30;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxEquity = Math.max(...points.map((p) => p.y), 1000);
    const minEquity = Math.min(...points.map((p) => p.y), -500);
    const equityRange = maxEquity - minEquity;

    const getX = (idx: number) => padding + (idx / (points.length - 1)) * chartWidth;
    const getY = (equity: number) => {
      return height - padding - ((equity - minEquity) / (equityRange || 1)) * chartHeight;
    };

    // Build SVG Path line
    let pathD = `M ${getX(0)} ${getY(0)}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${getX(i)} ${getY(points[i].y)}`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Zero baseline */}
        <line
          x1={padding}
          y1={getY(0)}
          x2={width - padding}
          y2={getY(0)}
          stroke="#1E293B"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Shading area below equity curve */}
        <path
          d={`${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`}
          fill="rgba(59, 130, 246, 0.05)"
        />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, idx) => {
          const cx = getX(idx);
          const cy = getY(p.y);
          return (
            <g key={idx} className="group/dot">
              <circle
                cx={cx}
                cy={cy}
                r="4"
                fill="#2563eb"
                stroke="#020617"
                strokeWidth="1.5"
                className="cursor-pointer hover:r-6 hover:fill-blue-500 transition-all"
              />
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="9"
                fontWeight="700"
                fontFamily="JetBrains Mono"
                className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none"
              >
                ${p.y}
              </text>
            </g>
          );
        })}

        {/* Y Axis Labels */}
        <text x={width - padding + 5} y={getY(maxEquity) + 4} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">
          ${maxEquity.toFixed(0)}
        </text>
        <text x={width - padding + 5} y={getY(minEquity) + 4} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">
          ${minEquity.toFixed(0)}
        </text>
        <text x={width - padding + 5} y={getY(0) + 4} fill="#475569" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
          $0
        </text>
      </svg>
    );
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-6 fade-in font-sans">
      {/* Header and export buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">System Performance & Reports</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Historical analytics, win rates, net equity growth, and audit logs.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#E2E8F0] bento-card hover:bg-[#0B0F19] border border-[#334155] rounded-lg shadow-2xs transition-colors cursor-pointer">
          <Download className="h-4 w-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bento-card border border-[#1E293B] p-1 rounded-xl shadow-2xs w-fit">
        <button
          onClick={() => setActiveReportTab("performance")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeReportTab === "performance" ? "bg-[#1E293B] text-[#F8FAFC] shadow-3xs" : "text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          Performance Analytics
        </button>
        <button
          onClick={() => setActiveReportTab("tradelog")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeReportTab === "tradelog" ? "bg-[#1E293B] text-[#F8FAFC] shadow-3xs" : "text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          Audit Setup Log
        </button>
        <button
          onClick={() => setActiveReportTab("backtester")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "backtester" ? "bg-[#1E293B] text-[#F8FAFC] shadow-3xs" : "text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" /> SMC Bot Backtester
        </button>
      </div>

      {activeReportTab === "performance" ? (
        <div className="space-y-6 fade-in">
          {tradeHistory.length === 0 ? (
            <div className="bento-card border border-[#1E293B] rounded-xl p-12 text-center text-[#64748B] text-xs font-sans">
              No historical recommended execution reports generated yet. Perform a market investigation first!
            </div>
          ) : (
            <>
              {/* Grid Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#F8FAFC]">${stats.netProfit.toLocaleString()}</div>
                    <div className="text-xs font-medium text-[#64748B]">Total Net Profit</div>
                  </div>
                </div>

                <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.winRate}%</div>
                    <div className="text-xs font-medium text-[#64748B]">System Win Rate</div>
                  </div>
                </div>

                <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.totalTrades}</div>
                    <div className="text-xs font-medium text-[#64748B]">Total Evaluated Setups</div>
                  </div>
                </div>

                <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.profitFactor}</div>
                    <div className="text-xs font-medium text-[#64748B]">System Profit Factor</div>
                  </div>
                </div>
              </div>

              {/* Equity Curve Shaded Line Chart */}
              <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">System Equity Curve</h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">PROFIT GROWTH ($)</span>
                </div>

                <div className="w-full">
                  {renderEquityCurve()}
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeReportTab === "tradelog" ? (
        /* Detailed Historic Trade list */
        <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs fade-in">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Historical Audit Records</h3>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase">Archived</span>
          </div>

          {tradeHistory.length === 0 ? (
            <div className="text-center py-12 text-[#64748B] text-xs font-medium">
              No historical setups logged. Start by generating a Market Thesis in the AI Cockpit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Instrument</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Entry</th>
                    <th className="py-2.5">Exit</th>
                    <th className="py-2.5">R:R</th>
                    <th className="py-2.5">Profit/Loss</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/40 font-mono text-xs">
                  {tradeHistory.map((tr) => (
                    <tr key={tr.id} className="hover:bg-[#0B0F19]/50 transition-colors">
                      <td className="py-3 text-[#F8FAFC] font-bold">{tr.id}</td>
                      <td className="py-3 text-[#64748B] font-bold">{formatDate(tr.timestamp)}</td>
                      <td className="py-3 text-[#F8FAFC] font-bold">{tr.pair}</td>
                      <td className={`py-3 font-bold ${tr.type === "BUY" ? "text-emerald-600" : "text-rose-600"}`}>
                        {tr.type}
                      </td>
                      <td className="py-3 text-[#94A3B8]">{tr.entryPrice.toFixed(tr.pair.includes("JPY") ? 2 : 5)}</td>
                      <td className="py-3 text-[#94A3B8]">
                        {tr.exitPrice ? tr.exitPrice.toFixed(tr.pair.includes("JPY") ? 2 : 5) : "-"}
                      </td>
                      <td className="py-3 text-[#94A3B8]">1:{tr.riskToReward}</td>
                      <td className={`py-3 font-bold ${tr.profitAmount && tr.profitAmount > 0 ? "text-emerald-600" : tr.profitAmount && tr.profitAmount < 0 ? "text-rose-600" : "text-[#64748B]"}`}>
                        {tr.profitAmount ? `${tr.profitAmount > 0 ? "+" : ""}$${tr.profitAmount}` : "-"}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tr.status === "WIN"
                            ? "bg-emerald-50 text-emerald-700"
                            : tr.status === "LOSS"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SMC Bot Backtesting Suite */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
          
          {/* Settings Panel */}
          <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs lg:col-span-1 h-fit">
            <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 mb-4">
              <Cpu className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Backtest Parameters</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Asset Instrument</label>
                <select 
                  value={backtestPair}
                  onChange={(e) => setBacktestPair(e.target.value)}
                  className="w-full bg-[#090D16] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] font-bold"
                >
                  <option value="EURUSD">EURUSD (Euro / US Dollar)</option>
                  <option value="GBPUSD">GBPUSD (Sterling / US Dollar)</option>
                  <option value="USDJPY">USDJPY (US Dollar / Japanese Yen)</option>
                  <option value="XAUUSD">XAUUSD (Spot Gold / US Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Bot Strategy Mode</label>
                <select 
                  value={backtestMode}
                  onChange={(e) => setBacktestMode(e.target.value)}
                  className="w-full bg-[#090D16] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] font-bold"
                >
                  <option value="Standard SMC">Standard SMC (OB & FVG Mitigations)</option>
                  <option value="ICT Silver Bullet">ICT Silver Bullet (Time-boxed Imbalance Sweep)</option>
                  <option value="Liquidity Specialist">Liquidity Specialist (Strict Swing High/Low Sweep)</option>
                  <option value="Macro Position">Macro Position (Weekly/Daily Order Block Focus)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1.5">Risk Per Trade (%)</label>
                  <input 
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={backtestRisk}
                    onChange={(e) => setBacktestRisk(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#090D16] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1.5">Setups Count</label>
                  <input 
                    type="number"
                    min="5"
                    max="30"
                    value={backtestPeriods}
                    onChange={(e) => setBacktestPeriods(parseInt(e.target.value) || 10)}
                    className="w-full bg-[#090D16] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Starting Portfolio Balance ($)</label>
                <input 
                  type="number"
                  min="1000"
                  max="10000000"
                  step="5000"
                  value={backtestBalance}
                  onChange={(e) => setBacktestBalance(parseInt(e.target.value) || 100000)}
                  className="w-full bg-[#090D16] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] font-bold font-mono"
                />
              </div>

              <button
                onClick={handleRunBacktest}
                disabled={backtestLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold text-[#ffffff] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {backtestLoading ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                    <span>Bot Simulating Trades...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-white" />
                    <span>Run Bot Strategy Backtest</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {backtestLoading ? (
              <div className="bento-card border border-[#1E293B] rounded-xl p-16 text-center flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">Triggering Algorithmic SMC Bot Engine...</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-md">
                  Analyzing historical candle delivery matrices, tracking liquidity sweep validations, calculating order block mitigations, and generating professional strategist performance critiques.
                </p>
              </div>
            ) : backtestError ? (
              <div className="bento-card border border-[#1E293B] rounded-xl p-6 bg-rose-950/20 text-rose-400 text-xs text-center font-bold flex items-center gap-2 justify-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{backtestError}</span>
              </div>
            ) : backtestResults ? (
              <div className="space-y-6 fade-in">
                
                {/* Backtest Performance Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#090D16] border border-[#1E293B] rounded-xl text-center">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-1">Ending Balance</span>
                    <span className="text-lg font-bold font-mono text-[#F8FAFC]">
                      ${backtestResults.metrics.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 bg-[#090D16] border border-[#1E293B] rounded-xl text-center">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-1">Net Gain</span>
                    <span className={`text-lg font-bold font-mono ${backtestResults.metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {backtestResults.metrics.netProfit >= 0 ? "+" : ""}${backtestResults.metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-4 bg-[#090D16] border border-[#1E293B] rounded-xl text-center">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-1">Win Rate</span>
                    <span className="text-lg font-bold font-mono text-blue-400">
                      {backtestResults.metrics.winRate}%
                    </span>
                  </div>
                  <div className="p-4 bg-[#090D16] border border-[#1E293B] rounded-xl text-center">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase block mb-1">Profit Factor</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {backtestResults.metrics.profitFactor}
                    </span>
                  </div>
                </div>

                {/* Algorithmic Critique Panel */}
                <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 mb-4">
                    <BookOpen className="h-4.5 w-4.5 text-blue-500" />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">AI Specialist Strategy Review & Critique</h3>
                  </div>
                  <div className="text-xs text-[#94A3B8] leading-relaxed markdown-body whitespace-pre-wrap select-text selection:bg-blue-900/40">
                    {backtestResults.critique}
                  </div>
                </div>

                {/* Simulated Trades Audit */}
                <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-xs">
                  <div className="border-b border-[#1E293B] pb-3 mb-4">
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Simulated Executions Log</h3>
                  </div>

                  <div className="space-y-3 font-mono text-xs max-h-[350px] overflow-y-auto pr-1">
                    {backtestResults.trades.map((t) => {
                      const isWin = t.status === "WIN";
                      return (
                        <div 
                          key={t.id}
                          className="p-3.5 rounded-lg bg-[#090D16] border border-[#1E293B]/50 hover:border-[#334155] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[#64748B] font-bold">{t.id}</span>
                              <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                t.type === "BUY" ? "bg-emerald-950/40 text-emerald-400" : "bg-rose-950/40 text-rose-400"
                              }`}>
                                {t.type}
                              </span>
                              <span className="text-[#F8FAFC] font-extrabold">{t.pair}</span>
                            </div>
                            <span className={`flex items-center gap-1 font-bold text-[10px] uppercase ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                              {isWin ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {t.status} ({isWin ? "+" : ""}${t.profitAmount.toLocaleString()})
                            </span>
                          </div>

                          <p className="text-[11px] text-[#94A3B8] mt-2 italic">
                            Trigger: {t.confluenceReason}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 border-t border-[#1E293B]/30 pt-2 text-[10px] text-[#64748B]">
                            <div>Entry: <span className="text-[#F8FAFC] font-bold">{t.entryPrice.toFixed(t.pair.includes("JPY") ? 2 : 5)}</span></div>
                            <div>Exit: <span className="text-[#F8FAFC] font-bold">{t.exitPrice.toFixed(t.pair.includes("JPY") ? 2 : 5)}</span></div>
                            <div>Stop Loss: <span className="text-[#F8FAFC] font-bold">{t.stopLoss.toFixed(t.pair.includes("JPY") ? 2 : 5)}</span></div>
                            <div>Target TP: <span className="text-[#F8FAFC] font-bold">{t.takeProfit.toFixed(t.pair.includes("JPY") ? 2 : 5)}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bento-card border border-[#1E293B] rounded-xl p-16 text-center flex flex-col items-center justify-center gap-3">
                <Cpu className="h-8 w-8 text-blue-500 animate-pulse" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">Backtest Simulator Idle</h4>
                <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed">
                  Configure your starting balance, choose your preferred pair and strategic SMC/ICT model, and run the simulator to stress-test your rules across historical cycles.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
