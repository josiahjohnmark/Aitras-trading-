import React, { useEffect, useState } from "react";
import { MarketThesis } from "../types";
import InstitutionalReport from "./InstitutionalReport";
import { 
  Loader2, 
  Sparkles, 
  Send, 
  User, 
  Cpu, 
  MessageSquare,
  Sliders
} from "lucide-react";

interface AnalysisWorkspaceProps {
  currentPair: string;
  currentTimeframe: string;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (tf: string) => void;
  thesis: MarketThesis | null;
  loadingAnalysis: boolean;
  onLogTrade: (trade: any) => void;
}

export default function AnalysisWorkspace({
  currentPair,
  currentTimeframe,
  onPairChange,
  onTimeframeChange,
  thesis,
}: AnalysisWorkspaceProps) {
  // Persistent cognitive chat timeline states
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const forexPairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];
  const timeframes = ["M5", "M15", "H1", "H4", "D1"];

  // Active formulated thesis state loaded from memory
  const [activeThesis, setActiveThesis] = useState<MarketThesis | null>(null);

  // Selected confluences filter checklist state
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([
    "ob", "fvg", "choch", "mss", "liquidity", "bb", "premium_discount", "ote"
  ]);

  // Fetch previous thesis from cache or memory when pair or timeframe changes
  useEffect(() => {
    setActiveThesis(null);
    setMessages([]);
    
    // Attempt to load existing thesis for this pair/timeframe combination
    fetch(`/api/memory?key=thesis_${currentPair}_${currentTimeframe}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          setActiveThesis(parsed);
          initializeChatWithThesis(parsed);
        }
      })
      .catch(e => console.log("No previous thesis found in memory cache:", e));
  }, [currentPair, currentTimeframe]);

  // Helper: setup initial conversation from a formulated thesis
  const initializeChatWithThesis = (thesisData: MarketThesis) => {
    const formattedReport = `### AITRAS Market Thesis Active
    
I have formulated the primary directional thesis for **${thesisData.pair} (${thesisData.timeframe})**.

* **Directional Bias:** **${thesisData.bias}**
* **Confidence Rating:** **${thesisData.confidenceScore}%** (${thesisData.confidence.replace("_", " ")})
* **Executive Summary:** ${thesisData.summary}

#### Core Supporting Confluences:
${thesisData.supportingEvidence.map(e => `- ${e}`).join("\n")}

#### Primary Scenario Path:
${thesisData.scenarios?.primary || "Awaiting target mitigation."}

***

*Ask me questions regarding this thesis, or filter the **SMC / ICT Confluences** on the left panel to refine my analytical commentary.*`;

    setMessages([
      { role: "model", content: formattedReport }
    ]);
  };

  // Send interactive conversation message to analytical backend
  const handleSendChat = async (text?: string) => {
    const userText = text || inputValue;
    if (!userText.trim() || loadingChat) return;

    if (!text) setInputValue("");
    const newHistory = [...messages, { role: "user" as const, content: userText }];
    setMessages(newHistory);
    setLoadingChat(true);

    try {
      const response = await fetch("/api/analysis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          pair: currentPair,
          timeframe: currentTimeframe,
          thesis: activeThesis,
          chatHistory: newHistory,
          selectedConfluences: selectedConfluences, // Send selected confluences to backend
          chartState: {
            indicators: ["RSI", "SMA"],
            drawingsCount: 0
          }
        })
      });

      const resData = await response.json();
      if (resData.response) {
        const replyText = resData.response;
        setMessages(prev => [...prev, { role: "model" as const, content: replyText }]);
      }
    } catch (err) {
      console.error("Analytical chat failure:", err);
      setMessages(prev => [...prev, { role: "model" as const, content: "An error occurred while transmitting to the Chief Analyst." }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full text-text-main font-sans transition-colors duration-200 overflow-hidden bg-app-bg">
      
      {/* Left Column - Filter & Confluence Controls */}
      <aside className="w-80 border-r border-border-custom bg-sidebar-bg flex flex-col p-4.5 shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3 mb-1">
            <Sliders className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-text-main uppercase tracking-wider font-sans">COCKPIT FILTERS</span>
          </div>

          {/* Instrument Picker */}
          <div>
            <span className="text-[9px] font-extrabold text-text-sub uppercase tracking-wider block mb-1.5 font-sans">TRADING ASSET</span>
            <div className="grid grid-cols-2 gap-1.5">
              {forexPairs.map((pair) => (
                <button
                  key={pair}
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

          {/* Timeframe Picker */}
          <div>
            <span className="text-[9px] font-extrabold text-text-sub uppercase tracking-wider block mb-1.5 font-sans">TIMEFRAME</span>
            <div className="grid grid-cols-5 gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
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

          {/* SMC & ICT Confluences Filter Checklist */}
          <div className="border-t border-border-custom pt-4">
            <span className="text-[9px] font-extrabold text-text-sub uppercase tracking-wider block mb-2.5 font-sans">SMC / ICT CONFLUENCES</span>
            <div className="space-y-1.5 font-sans">
              {[
                { id: "ob", label: "Order Block (OB)" },
                { id: "fvg", label: "Fair Value Gap (FVG)" },
                { id: "choch", label: "Change of Character (CHoCH)" },
                { id: "mss", label: "Market Structure Shift (MSS)" },
                { id: "liquidity", label: "Liquidity Pools (BSL/SSL)" },
                { id: "bb", label: "Breaker Block (BB)" },
                { id: "premium_discount", label: "Premium/Discount Pricing" },
                { id: "ote", label: "Optimal Trade Entry (OTE)" },
              ].map((conf) => {
                const active = selectedConfluences.includes(conf.id);
                return (
                  <button
                    key={conf.id}
                    onClick={() => setSelectedConfluences(prev =>
                      prev.includes(conf.id) ? prev.filter(x => x !== conf.id) : [...prev, conf.id]
                    )}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      active 
                        ? "bg-blue-600/10 text-blue-600 border-blue-500/20 shadow-inner" 
                        : "bg-input-bg text-text-sub border-border-custom hover:text-text-main"
                    }`}
                  >
                    <span className="truncate">{conf.label}</span>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-white text-[8px] transition-all duration-200 ${
                      active ? "bg-blue-600 border-blue-500" : "bg-transparent border-border-custom"
                    }`}>
                      {active && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Right Column - Dedicated Full-Screen Chat Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg">
        <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
          
          <div className="bento-card border border-border-custom rounded-2xl shadow-sm flex flex-col h-full min-h-0 bg-card-bg">
            <div className="px-5 py-3.5 border-b border-border-custom flex items-center justify-between bg-input-bg/40 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-text-main">
                  AITRAS Cognitive Chat: Chief SMC Analyst
                </span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-550 animate-pulse" />
                COGNITIVE CORE ACTIVE
              </span>
            </div>

            {/* Chat Timeline */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-0 bg-card-bg/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto py-12">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-inner">
                    <Sparkles className="h-7 w-7 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main">AITRAS Cognitive Chat Console</h4>
                    <p className="text-xs text-text-sub mt-2 leading-relaxed font-semibold">
                      The persistent Chief Analyst model is online. Use the **SMC Terminal** to run market investigations, or use the panel on the left to filter specific confluences and ask direct questions.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isModel = msg.role === "model";
                  const displayText = msg.content;

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 max-w-[95%] w-full ${isModel ? "self-start" : "self-end flex-row-reverse ml-auto"}`}
                    >
                      <div className={`p-2.5 rounded-xl h-8.5 w-8.5 flex items-center justify-center shrink-0 border shadow-sm ${
                        isModel ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-input-bg border-border-custom text-text-sub"
                      }`}>
                        {isModel ? <Cpu className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                      </div>
                      {isModel ? (
                        <div className="flex-1 min-w-0">
                          <InstitutionalReport
                            content={displayText}
                            onSelectSuggestion={(prompt) => handleSendChat(prompt)}
                            isNewMessage={idx === messages.length - 1 && loadingChat}
                            pair={currentPair}
                            timeframe={currentTimeframe}
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl text-[12px] leading-relaxed bg-blue-600 text-white font-semibold max-w-[85%] shadow-md">
                          <div className="whitespace-pre-line font-sans">{displayText}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {loadingChat && (
                <div className="flex gap-3 max-w-[90%] self-start">
                  <div className="p-2.5 rounded-xl h-8.5 w-8.5 flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Loader2 className="animate-spin h-4.5 w-4.5" />
                  </div>
                  <div className="p-4 rounded-2xl text-[12px] bg-input-bg border border-border-custom text-text-sub font-semibold animate-pulse">
                    Chief Analyst is formulating reasoning based on selected confluences...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border-custom bg-input-bg/50 flex gap-2 rounded-b-2xl shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask technical questions or select confluences on the left to direct the analysis..."
                disabled={loadingChat}
                className="flex-1 bento-card border border-border-custom rounded-xl px-4 py-3 text-xs text-text-main bg-input-bg focus:outline-none focus:border-blue-500 disabled:cursor-not-allowed font-semibold shadow-inner"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={!inputValue.trim() || loadingChat}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
