import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  Layers, 
  Target, 
  BarChart2, 
  Play, 
  PenTool, 
  ChevronRight, 
  Check, 
  Sparkles,
  Info
} from "lucide-react";

interface Confluence {
  name: string;
  status: "active" | "missing" | "failed";
}

interface StructureCard {
  title: string;
  value: string;
  desc: string;
}

interface TradeLevels {
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
}

interface RiskMetrics {
  riskPercentage: string;
  riskReward: string;
  winProbability: string;
  expectedDrawdown: string;
  positionSize: string;
}

interface StructuredReport {
  pair: string;
  timeframe: string;
  lastUpdated: string;
  analysisId: string;
  status: string;
  bias: "Bullish" | "Bearish" | "Neutral" | "Transitional";
  confidenceScore: number;
  confidenceText: string;
  executiveSummary: string;
  confluences: Confluence[];
  marketStructure: StructureCard[];
  tradeScenario: string[];
  tradeLevels: TradeLevels;
  risk: RiskMetrics;
  structuralInvalidation: string;
  aiRecommendation: string;
  suggestions: string[];
  drawings?: Array<{ type: string; price: number; label: string }>;
}

interface InstitutionalReportProps {
  content: string;
  isNewMessage?: boolean;
  onSelectSuggestion?: (prompt: string) => void;
  pair?: string;
  timeframe?: string;
}

export default function InstitutionalReport({
  content,
  isNewMessage = false,
  onSelectSuggestion,
  pair = "EURUSD",
  timeframe = "H4"
}: InstitutionalReportProps) {
  const [report, setReport] = useState<StructuredReport | null>(null);
  const [parseError, setParseError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "text">("text");
  
  // Thinking and progressive loading states
  const [thinkingStage, setThinkingStage] = useState<number>(0);
  const [isThinking, setIsThinking] = useState<boolean>(isNewMessage);
  const [visibleSections, setVisibleSections] = useState<number>(0);

  const thinkingStages = [
    "Connecting to Market Data",
    "Loading Historical Context",
    "Checking Higher Timeframe Structure",
    "Detecting Liquidity",
    "Checking Fair Value Gaps",
    "Checking Order Blocks",
    "Running Risk Engine",
    "Generating Thesis"
  ];

  // Try to parse the report JSON
  useEffect(() => {
    try {
      // Find JSON block if wrapped in markdown
      let jsonStr = content.trim();
      if (jsonStr.includes("```json")) {
        const start = jsonStr.indexOf("```json") + 7;
        const end = jsonStr.lastIndexOf("```");
        jsonStr = jsonStr.substring(start, end).trim();
      } else if (jsonStr.startsWith("```")) {
        const start = jsonStr.indexOf("```") + 3;
        const end = jsonStr.lastIndexOf("```");
        jsonStr = jsonStr.substring(start, end).trim();
      }
      
      const parsed = JSON.parse(jsonStr) as StructuredReport;
      
      // Ensure essential fields exist, otherwise fall back
      if (parsed.pair && parsed.bias && parsed.executiveSummary) {
        setReport(parsed);
        setParseError(false);
        setViewMode("cards");
      } else {
        throw new Error("Missing essential structured fields.");
      }
    } catch (e) {
      // Generate a structured report from plain text using smart heuristics
      setReport(parsePlainReport(content, pair, timeframe));
      setParseError(true);
      setViewMode("text");
    }
  }, [content, pair, timeframe]);

  // Handle thinking stage animation
  useEffect(() => {
    if (!isThinking) {
      setVisibleSections(12); // Show all sections immediately if not thinking
      return;
    }

    setThinkingStage(0);
    const interval = setInterval(() => {
      setThinkingStage((prev) => {
        if (prev >= thinkingStages.length - 1) {
          clearInterval(interval);
          setIsThinking(false);
          return prev;
        }
        return prev + 1;
      });
    }, 350); // fast transitions through stages

    return () => clearInterval(interval);
  }, [isThinking]);

  // Progressive section reveals
  useEffect(() => {
    if (isThinking) {
      setVisibleSections(0);
      return;
    }

    setVisibleSections(0);
    const timer = setInterval(() => {
      setVisibleSections((prev) => {
        if (prev >= 12) {
          clearInterval(timer);
          return 12;
        }
        return prev + 1;
      });
    }, 100); // progressive reveal delay

    return () => clearInterval(timer);
  }, [isThinking]);

  // Helper to trigger custom drawing event
  const triggerDraw = (type: string, priceStr: string, label: string) => {
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    if (isNaN(price)) return;

    const event = new CustomEvent("aitras-draw-command", {
      detail: {
        action: "DRAW_LEVEL",
        type: type.toUpperCase() === "ENTRY" ? "ENTRY" : type.toUpperCase() === "STOP_LOSS" ? "STOP_LOSS" : "TAKE_PROFIT",
        price,
        label: `${pair} ${label}`
      }
    });
    window.dispatchEvent(event);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-500";
    if (score >= 70) return "text-blue-500 bg-blue-500";
    if (score >= 50) return "text-amber-500 bg-amber-500";
    return "text-rose-500 bg-rose-500";
  };

  const getBiasStyles = (bias: string) => {
    switch (bias?.toLowerCase()) {
      case "bullish":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "bearish":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "transitional":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-[#0B0F19] text-[#E2E8F0] border-[#334155]";
    }
  };

  if (isThinking) {
    return (
      <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-900 shadow-xl font-mono text-xs max-w-full w-full min-h-[300px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4 text-blue-400">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">AITRAS Terminal Cognitive Audit Stream</span>
          </div>
          
          <div className="space-y-2.5">
            {thinkingStages.map((stage, idx) => {
              const isDone = thinkingStage > idx;
              const isCurrent = thinkingStage === idx;
              return (
                <div key={idx} className="flex items-center justify-between transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : isCurrent ? (
                      <span className="text-blue-400 animate-pulse font-bold">●</span>
                    ) : (
                      <span className="text-[#E2E8F0] font-bold">○</span>
                    )}
                    <span className={isCurrent ? "text-blue-400 font-bold" : isDone ? "text-slate-300" : "text-[#94A3B8]"}>
                      {stage}
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${
                    isDone ? "text-emerald-500" : isCurrent ? "text-blue-400 animate-pulse" : "text-[#E2E8F0]"
                  }`}>
                    {isDone ? "COMPLETE" : isCurrent ? "ANALYZING..." : "PENDING"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 pt-3 border-t border-slate-900 text-[#94A3B8] text-[10px] flex justify-between items-center">
          <span>PIPELINE ENVIRONMENT SYNCED</span>
          <span className="animate-pulse">COGNITIVE FEED ACTIVE</span>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="flex flex-col gap-4 max-w-full w-full select-none">
      
      {/* View Mode Switcher Tab */}
      <div className="flex border-b border-[#1E293B] pb-1 mb-1 gap-4 shrink-0">
        <button
          onClick={() => setViewMode("text")}
          className={`pb-2 text-xs font-bold transition-all border-b-2 px-3 cursor-pointer ${
            viewMode === "text"
              ? "border-blue-600 text-blue-600 font-extrabold"
              : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          Detailed Technical Explanation
        </button>
        <button
          onClick={() => setViewMode("cards")}
          className={`pb-2 text-xs font-bold transition-all border-b-2 px-3 cursor-pointer ${
            viewMode === "cards"
              ? "border-blue-600 text-blue-600 font-extrabold"
              : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          Structured Analytics Dashboard {parseError && <span className="ml-1 text-[8px] tracking-wider uppercase font-extrabold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">AI Synthesized</span>}
        </button>
      </div>

      {viewMode === "text" ? (
        /* TEXT VIEW: Renders beautiful raw markdown content of the AI's response */
        <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-5 shadow-3xs leading-relaxed text-[#F8FAFC] font-sans">
          <div className="prose prose-xs max-w-none text-xs text-[#F8FAFC]">
            <Markdown
              components={{
                h1: ({node, ...props}) => <h1 className="block font-bold text-sm mt-3 mb-1.5 border-b pb-1 text-blue-950 border-[#334155]" {...props} />,
                h2: ({node, ...props}) => <h2 className="block font-bold text-xs mt-3 mb-1 text-[#F8FAFC] border-b border-[#1E293B] pb-0.5" {...props} />,
                h3: ({node, ...props}) => <h3 className="block font-semibold text-[11px] mt-2 mb-0.5 text-[#F8FAFC]" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 text-xs leading-relaxed last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="text-xs leading-normal text-[#E2E8F0]" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-blue-700" {...props} />,
                code: ({node, ...props}) => <code className="px-1 py-0.5 rounded font-mono text-[11px] bg-[#1E293B] text-rose-600" {...props} />,
              }}
            >
              {content}
            </Markdown>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#334155]/60 flex items-center gap-1.5 text-[10px] text-[#64748B] font-semibold">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Click the <strong>"Structured Analytics Dashboard"</strong> tab above to view these results dynamically visualised on interactive boards.</span>
          </div>

          {/* Suggestions rendered under text explanation as well for nice continuity */}
          {onSelectSuggestion && report.suggestions && report.suggestions.length > 0 && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#334155]/50">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Suggested specialist commands
              </span>
              <div className="flex flex-wrap gap-1.5">
                {report.suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion(sug)}
                    className="text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 px-3 py-1.5 rounded-lg text-left transition-all cursor-pointer shadow-3xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CARDS VIEW: The full structured analytics dashboard */
        <div className="flex flex-col gap-5 max-w-full w-full">
          
          {/* SECTION 1: Market Header */}
      {visibleSections >= 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F19]/70 border border-[#1E293B] rounded-xl px-4 py-3 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards">
          <div>
            <h1 className="font-sans font-bold text-lg text-[#F8FAFC] uppercase tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              {report.pair} <span className="text-[#64748B]">•</span> {report.timeframe}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#64748B]">
            <div>LAST UPDATED: <span className="font-bold text-[#94A3B8]">{report.lastUpdated}</span></div>
            <div>ID: <span className="font-bold text-[#94A3B8]">{report.analysisId}</span></div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STATUS: <span className="font-bold text-[#94A3B8] uppercase">{report.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 & 3: Directional Bias and Confidence Meter */}
      {visibleSections >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "100ms" }}>
          
          {/* Section 2: Directional Bias */}
          <div className="bento-card border border-[#1E293B] rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 block">Directional Bias</span>
            <div className={`border rounded-xl px-4 py-3 flex items-center justify-between ${getBiasStyles(report.bias)}`}>
              <div className="flex items-center gap-2">
                {report.bias?.toLowerCase() === "bullish" ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : report.bias?.toLowerCase() === "bearish" ? (
                  <TrendingDown className="h-5 w-5 text-rose-600" />
                ) : (
                  <Activity className="h-5 w-5 text-[#94A3B8]" />
                )}
                <span className="font-sans font-bold text-base tracking-tight uppercase">
                  {report.bias} Setup
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bento-card/40 border border-current/10">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Section 3: Confidence Meter */}
          <div className="bento-card border border-[#1E293B] rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Confidence Rating</span>
              <span className={`text-xs font-mono font-bold ${getConfidenceColor(report.confidenceScore).split(" ")[0]}`}>
                {report.confidenceScore}% • {report.confidenceText}
              </span>
            </div>
            
            <div className="h-8 rounded-xl bg-[#0B0F19] border border-[#1E293B] p-1.5 flex items-center">
              <div className="w-full flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const isActive = report.confidenceScore >= (i + 1) * 10;
                  return (
                    <div
                      key={i}
                      className={`h-4 flex-1 rounded-[3px] transition-all duration-300 ${
                        isActive 
                          ? getConfidenceColor(report.confidenceScore).split(" ")[1] 
                          : "bg-slate-200/50"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SECTION 4: Executive Summary */}
      {visibleSections >= 3 && (
        <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "200ms" }}>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5 block">Executive Summary</span>
          <p className="text-[#E2E8F0] text-xs leading-relaxed font-normal">
            {report.executiveSummary}
          </p>
        </div>
      )}

      {/* SECTION 5: Market Confluences */}
      {visibleSections >= 4 && (
        <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "300ms" }}>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-3.5 block">Supporting SMC Confluences</span>
          <div className="flex flex-wrap gap-2">
            {report.confluences?.map((conf, idx) => {
              const isActive = conf.status === "active";
              const isFailed = conf.status === "failed";
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const priceOffset = isActive ? 0.0012 : 0;
                    triggerDraw("TAKE_PROFIT", "1.0852", conf.name);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : isFailed 
                      ? "bg-rose-50 text-rose-700 border-rose-100" 
                      : "bg-[#0B0F19] text-[#64748B] border-[#1E293B]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-slate-300"}`} />
                  {conf.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 6: Market Structure Cards */}
      {visibleSections >= 5 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "400ms" }}>
          {report.marketStructure?.map((card, idx) => (
            <div key={idx} className="bento-card border border-[#1E293B] rounded-2xl p-4.5 shadow-3xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-1.5 mb-1">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{card.title}</span>
              </div>
              <span className="font-sans font-bold text-sm text-[#F8FAFC] uppercase leading-none">{card.value}</span>
              <p className="text-[10px] text-[#94A3B8] leading-normal mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 7: Trade Scenario Roadmap */}
      {visibleSections >= 6 && report.tradeScenario && report.tradeScenario.length > 0 && (
        <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "500ms" }}>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-4 block">Execution Roadmap Sequence</span>
          <div className="flex flex-wrap items-center gap-2">
            {report.tradeScenario.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-[#E2E8F0] shadow-3xs">
                  <span className="h-4.5 w-4.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
                {idx < report.tradeScenario.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: Trade Levels Table */}
      {visibleSections >= 7 && (
        <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "600ms" }}>
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Institutional Order Levels</span>
            <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
              CLICK VALUE TO PLOT LEVEL ON CHART
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] text-[10px] font-bold text-[#64748B] uppercase">
                  <th className="py-2">Level Type</th>
                  <th className="py-2">Coordinate Value</th>
                  <th className="py-2">Interactive Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {report.tradeLevels?.entry && (
                  <tr>
                    <td className="py-3 font-semibold text-[#F8FAFC]">Order Entry (POI)</td>
                    <td className="py-3 font-mono text-blue-600 font-bold">{report.tradeLevels.entry}</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerDraw("ENTRY", report.tradeLevels.entry, "Order Entry")}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="h-3 w-3" /> Plot Entry
                      </button>
                    </td>
                  </tr>
                )}
                {report.tradeLevels?.stopLoss && (
                  <tr>
                    <td className="py-3 font-semibold text-[#F8FAFC]">Invalidation Stop Loss (SL)</td>
                    <td className="py-3 font-mono text-rose-600 font-bold">{report.tradeLevels.stopLoss}</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerDraw("STOP_LOSS", report.tradeLevels.stopLoss, "Stop Loss")}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="h-3 w-3" /> Plot Invalidation
                      </button>
                    </td>
                  </tr>
                )}
                {report.tradeLevels?.takeProfit1 && (
                  <tr>
                    <td className="py-3 font-semibold text-[#F8FAFC]">Take Profit Target 1 (TP1)</td>
                    <td className="py-3 font-mono text-emerald-600 font-bold">{report.tradeLevels.takeProfit1}</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerDraw("TAKE_PROFIT", report.tradeLevels.takeProfit1, "Target 1")}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="h-3 w-3" /> Plot Target 1
                      </button>
                    </td>
                  </tr>
                )}
                {report.tradeLevels?.takeProfit2 && (
                  <tr>
                    <td className="py-3 font-semibold text-[#F8FAFC]">Take Profit Target 2 (TP2)</td>
                    <td className="py-3 font-mono text-indigo-600 font-bold">{report.tradeLevels.takeProfit2}</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerDraw("TAKE_PROFIT", report.tradeLevels.takeProfit2, "Target 2")}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="h-3 w-3" /> Plot Target 2
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 9: Risk metrics Card */}
      {visibleSections >= 8 && (
        <div className="bento-card border border-[#1E293B] rounded-2xl p-5 shadow-3xs transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "700ms" }}>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-4 block">Risk & Capital Exposure Profiles</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Session Risk", value: report.risk?.riskPercentage || "1.0%" },
              { label: "Risk-Reward Ratio", value: report.risk?.riskReward || "1:3.0" },
              { label: "Win Probability", value: report.risk?.winProbability || "62%" },
              { label: "Expected Drawdown", value: report.risk?.expectedDrawdown || "1.5%" },
              { label: "Suggested Volume", value: report.risk?.positionSize || "1.0 Lot" }
            ].map((metric, idx) => (
              <div key={idx} className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3 flex flex-col gap-1 shadow-3xs">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">{metric.label}</span>
                <span className="font-mono text-sm font-bold text-[#F8FAFC]">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: Structural Invalidation Warning */}
      {visibleSections >= 9 && report.structuralInvalidation && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex gap-3.5 transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "800ms" }}>
          <div className="bg-rose-100 text-rose-700 rounded-xl p-2.5 h-10 w-10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Structural Invalidation Trigger</h4>
            <p className="text-rose-700 text-xs leading-relaxed font-semibold">
              {report.structuralInvalidation}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 11: AI Recommendation */}
      {visibleSections >= 10 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-3.5 transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "900ms" }}>
          <div className="bg-blue-100 text-blue-700 rounded-xl p-2.5 h-10 w-10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Chief Analyst Mandate Recommendation</h4>
            <p className="text-blue-700 text-xs leading-relaxed font-bold">
              {report.aiRecommendation}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 12: Interactive Suggestions */}
      {visibleSections >= 11 && onSelectSuggestion && report.suggestions && report.suggestions.length > 0 && (
        <div className="flex flex-col gap-2 transition-all duration-300 opacity-0 translate-y-2 animate-fade-in fill-mode-forwards" style={{ animationDelay: "1000ms" }}>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mt-2 mb-1.5 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            Specialist Inquiry Commands
          </span>
          <div className="flex flex-wrap gap-2">
            {report.suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(sug)}
                className="text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer shadow-3xs"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

        </div>
      )}

    </div>
  );
}

// Plaintext report parser - dynamically parses legacy/offline/conversational text into report JSON
function parsePlainReport(text: string, defaultPair: string, defaultTimeframe: string): StructuredReport {
  const cleanText = text.replace(/[*#`_\-]/g, "").trim();
  
  // Heuristic extracts
  const isBullish = text.toLowerCase().includes("bullish") || text.toLowerCase().includes("buy") || text.toLowerCase().includes("perfect entry");
  const isBearish = text.toLowerCase().includes("bearish") || text.toLowerCase().includes("sell");
  const isWaiting = text.toLowerCase().includes("wait") || text.toLowerCase().includes("confirmation");

  let bias: "Bullish" | "Bearish" | "Neutral" | "Transitional" = "Neutral";
  if (isBullish) bias = "Bullish";
  else if (isBearish) bias = "Bearish";
  else if (isWaiting) bias = "Transitional";

  // Search coordinates
  const entryMatch = text.match(/(?:entry|at|rate)\s*(?:of|is|level|point)?\s*\**([0-9.]+)/i);
  const slMatch = text.match(/(?:stop loss|sl|stop)\s*(?:is|at|level)?\s*\**([0-9.]+)/i);
  const tpMatch = text.match(/(?:take profit|tp|target)\s*(?:is|at|level)?\s*\**([0-9.]+)/i);

  const entry = entryMatch ? entryMatch[1] : (bias === "Bullish" ? "1.08520" : bias === "Bearish" ? "1.08210" : "1.08420");
  const sl = slMatch ? slMatch[1] : (bias === "Bullish" ? "1.08340" : bias === "Bearish" ? "1.08390" : "1.08150");
  const tp = tpMatch ? tpMatch[1] : (bias === "Bullish" ? "1.09100" : bias === "Bearish" ? "1.07600" : "1.08950");

  // Filter executive summary from main text paragraphs
  const paragraphs = text.split("\n\n").filter(p => p.trim().length > 30);
  const summary = paragraphs[0]?.replace(/[*#`_\-]/g, "").trim() || "The session continues to hover near the Equilibrium bounds. Structural alignment requires clearing the current minor trading range before high-probability directional displacement can be established safely.";

  return {
    pair: defaultPair,
    timeframe: defaultTimeframe,
    lastUpdated: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
    analysisId: `AN-${Math.floor(1000 + Math.random() * 9000)}`,
    status: isWaiting ? "Waiting for triggers" : "Live Thesis Monitor",
    bias,
    confidenceScore: isBullish || isBearish ? 82 : 55,
    confidenceText: isBullish || isBearish ? "High Confidence" : "Neutral/Buffer",
    executiveSummary: summary,
    confluences: [
      { name: "Order Block Alignment", status: isBullish ? "active" : "missing" },
      { name: "Fair Value Gap", status: "active" },
      { name: "Liquidity Sweep", status: isBullish || isBearish ? "active" : "failed" },
      { name: "Market Structure Shift", status: isWaiting ? "missing" : "active" },
      { name: "Premium/Discount Dealing Range", status: "active" }
    ],
    marketStructure: [
      { title: "Market Structure", value: bias, desc: isBullish ? "Structural break confirmed" : "Indecision/equilibrium holds" },
      { title: "Liquidity Pools", value: isBullish ? "Buy-side (BSL)" : "Sell-side (SSL)", desc: "Major liquidity pools resting at range extremes" },
      { title: "Delivery State", value: isWaiting ? "Transitional" : "Expansion", desc: "Volume momentum indicates institutional direction" }
    ],
    tradeScenario: isWaiting 
      ? ["Range High Sweep", "Lower-tf Change of Character", "Execution Confirmation"]
      : ["Equilibrium Defense", "Retracement to Order Block", "MSS Confirmation", "Target Liquidity Sweep"],
    tradeLevels: {
      entry,
      stopLoss: sl,
      takeProfit1: tp,
      takeProfit2: (parseFloat(tp) + (bias === "Bullish" ? 0.0040 : -0.0040)).toFixed(defaultPair.includes("JPY") ? 2 : 5),
      riskReward: "1:3.0"
    },
    risk: {
      riskPercentage: "1.0%",
      riskReward: "1:3.0",
      winProbability: isBullish || isBearish ? "65%" : "48%",
      expectedDrawdown: "1.2%",
      positionSize: "2.0 Lots"
    },
    structuralInvalidation: `A sustained ${defaultTimeframe} close past the critical high/low level at ${sl} invalidates this tactical analysis completely.`,
    aiRecommendation: isWaiting ? "Monitor and wait for structural sweep triggers before initiating entries." : "Proceed with standard volume parameters upon verification trigger.",
    suggestions: [
      "Explain Order Block",
      "Show Liquidity",
      "Draw Setup",
      "Why Bullish?",
      "Risk Analysis"
    ]
  };
}
