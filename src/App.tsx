import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AnalysisWorkspace from "./components/AnalysisWorkspace";
import SMCTerminal from "./components/SMCTerminal";
import Journal from "./components/Journal";
import Reports from "./components/Reports";
import RiskCalculator from "./components/RiskCalculator";
import { MarketThesis, TechnicalZone, SwingPoint, TradeRecord, JournalEntry } from "./types";
import { Sparkles, RefreshCw, AlertCircle, Menu, X, LayoutDashboard, BookOpen, BarChart3, Coins, LayoutGrid } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [currentPair, setCurrentPair] = useState<string>("EURUSD");
  const [currentTimeframe, setCurrentTimeframe] = useState<string>("H4");

  // Global Theme Setup
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("aitras_theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("aitras_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Shared Settings (with persistence in localStorage)
  const [riskPercentage, setRiskPercentage] = useState<number>(() => {
    return Number(localStorage.getItem("aitras_risk") || "1");
  });
  const [accountBalance, setAccountBalance] = useState<number>(() => {
    return Number(localStorage.getItem("aitras_balance") || "100000");
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("aitras_risk", riskPercentage.toString());
  }, [riskPercentage]);

  useEffect(() => {
    localStorage.setItem("aitras_balance", accountBalance.toString());
  }, [accountBalance]);

  // Market Data & Thesis States
  const [candles, setCandles] = useState<any[]>([]);
  const [zones, setZones] = useState<TechnicalZone[]>([]);
  const [swingPoints, setSwingPoints] = useState<SwingPoint[]>([]);
  const [thesis, setThesis] = useState<MarketThesis | null>(null);
  const [oandaDetails, setOandaDetails] = useState<any>(null);

  // Journal & History States
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    netProfit: 0,
    profitFactor: 2.4,
  });

  // Loading / UI feedback states
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [loadingAddEntry, setLoadingAddEntry] = useState<boolean>(false);
  const [loadingJournal, setLoadingJournal] = useState<boolean>(false);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Chat conversation
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; content: string }>>([]);

  // 1. Initial Load: Fetch journals, reports and initial market data
  useEffect(() => {
    fetchJournal();
    fetchReports();
    fetchMarketData(currentPair, currentTimeframe);
  }, []);

  // Fetch market data when pair or timeframe changes
  const handlePairChange = (pair: string) => {
    setCurrentPair(pair);
    fetchMarketData(pair, currentTimeframe);
  };

  const handleTimeframeChange = (tf: string) => {
    setCurrentTimeframe(tf);
    fetchMarketData(currentPair, tf);
  };

  // API Call: Fetch Market Data
  const fetchMarketData = async (pair: string, tf: string) => {
    setLoadingData(true);
    setGlobalError(null);
    try {
      const res = await fetch(`/api/market-data?pair=${pair}&timeframe=${tf}`);
      if (!res.ok) throw new Error("Could not retrieve market data from system.");
      const data = await res.json();
      setCandles(data.candles || []);
      setZones(data.analysis?.zones || []);
      setSwingPoints(data.analysis?.swingPoints || []);
      setOandaDetails(data.oandaDetails || null);
      
      // Auto-populate or reset thesis based on pair
      setThesis(null);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to establish secure connection with Market feed.");
    } finally {
      setLoadingData(false);
    }
  };

  // API Call: Fetch Journal Entries
  const fetchJournal = async () => {
    setLoadingJournal(true);
    setJournalError(null);
    try {
      const res = await fetch("/api/journal");
      if (!res.ok) throw new Error("Could not read journaling indices.");
      const data = await res.json();
      setJournalEntries(data);
    } catch (err: any) {
      console.error("Failed to read journaling indices:", err);
      setJournalError(err.message || "Failed to read journaling indices.");
    } finally {
      setLoadingJournal(false);
    }
  };

  // API Call: Fetch Performance Reports
  const fetchReports = async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Could not compile performance index.");
      const data = await res.json();
      setStats(data.stats);
      setTradeHistory(data.history || []);
    } catch (err: any) {
      console.error("Failed to compile performance index:", err);
      setReportsError(err.message || "Failed to compile performance index.");
    } finally {
      setLoadingReports(false);
    }
  };

  // API Call: Trigger Market Investigation with Gemini
  const handleTriggerAnalysis = async () => {
    setLoadingAnalysis(true);
    setGlobalError(null);
    try {
      // 1. Verify market sessions and availability via API data first
      const statusRes = await fetch("/api/market/status");
      let sessionDetails = "Unknown session status";
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        sessionDetails = `${statusData.isOpen ? "OPEN" : "CLOSED"} (${statusData.reason || "No detail"})`;
        console.log(`[AITRAS Session Pre-check]: Market is currently ${sessionDetails}`);
      }

      // 2. Force the Analysis Engine to perform a thorough, sequential check of all Top-Down stages
      const res = await fetch("/api/analysis/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: currentPair,
          timeframe: currentTimeframe,
          forceSequentialCheck: true,
          stages: ["MN", "W1", "D1", "H4", "H1", "M15", "M5", "M1"],
          marketSessionVerified: sessionDetails,
        }),
      });
      if (!res.ok) throw new Error("AITRAS Core model failed to formulate thesis.");
      const data = await res.json();
      
      setThesis(data.thesis);
      // Update with exact analyzed candles & indicators
      if (data.mathAnalysis) {
        setZones(data.mathAnalysis.zones || []);
        setSwingPoints(data.mathAnalysis.swingPoints || []);
      }
    } catch (err: any) {
      setGlobalError(err.message || "Cognitive market study failed to build.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // API Call: Chat Specialist interaction
  const handleSendMessage = async (msg: string, specialist: string) => {
    if (!msg.trim()) return;
    setLoadingChat(true);
    setGlobalError(null);

    const updatedHistory = [...chatHistory, { role: "user" as const, content: msg }];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          specialist,
          chatHistory: updatedHistory,
          pair: currentPair,
          timeframe: currentTimeframe,
          thesis: thesis,
        }),
      });
      if (!res.ok) throw new Error("Specialist was unable to construct response.");
      const data = await res.json();

      setChatHistory([...updatedHistory, { role: "model", content: data.response }]);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to get specialist answer.");
    } finally {
      setLoadingChat(false);
    }
  };

  // API Call: Vision image upload and analysis
  const handleSendImage = async (base64Image: string) => {
    setLoadingChat(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!res.ok) throw new Error("Vision system failed to process the image.");
      const data = await res.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: "[Uploaded Chart Workspace Screenshot]" },
        { role: "model", content: data.response },
      ]);
    } catch (err: any) {
      setGlobalError(err.message || "Image study processing failed.");
      throw err;
    } finally {
      setLoadingChat(false);
    }
  };

  // API Call: Create new Journal log
  const handleAddJournalEntry = async (entry: Omit<JournalEntry, "id" | "timestamp">) => {
    setLoadingAddEntry(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Journal service refused entry submission.");
      await fetchJournal();
    } catch (err: any) {
      setGlobalError(err.message || "Failed to commit journal log.");
    } finally {
      setLoadingAddEntry(false);
    }
  };

  // API Call: Create and simulate resolving a recommended trade
  const handleLogTrade = async (trade: {
    pair: string;
    type: "BUY" | "SELL";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskToReward: number;
    confidenceScore: number;
    lotSize: number;
    riskAmount: number;
  }) => {
    try {
      // 1. Log trade in active state
      const createRes = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: trade.pair,
          type: trade.type,
          entryPrice: trade.entryPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          riskToReward: trade.riskToReward,
          confidenceScore: trade.confidenceScore,
        }),
      });

      if (!createRes.ok) throw new Error("Could not log setup draft.");
      const loggedTrade: TradeRecord = await createRes.json();

      // 2. Simulate outcomes immediately for educational value
      // A high-confidence score improves win chance
      const winProbability = trade.confidenceScore > 80 ? 0.70 : 0.45;
      const isWin = Math.random() < winProbability;

      const status = isWin ? "WIN" : "LOSS";
      const exitPrice = isWin ? trade.takeProfit : trade.stopLoss;
      const profitAmount = isWin
        ? parseFloat((trade.riskAmount * trade.riskToReward).toFixed(2))
        : parseFloat((-trade.riskAmount).toFixed(2));

      // Resolve on backend
      const resolveRes = await fetch(`/api/trades/${loggedTrade.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          exitPrice,
          profitAmount,
        }),
      });

      if (!resolveRes.ok) throw new Error("Resolution calculation rejected.");

      // 3. Update state reports and statistics
      await fetchReports();

      // 4. Auto-generate a journal log to document this simulated setup study
      await handleAddJournalEntry({
        type: "trade",
        title: `AITRAS Simulated Setup: ${trade.pair} ${trade.type} (${status})`,
        content: `Logged a simulated ${trade.type} setup at entry ${trade.entryPrice} with Stop Loss ${trade.stopLoss} and Take Profit ${trade.takeProfit}.
Result: ${status} (Simulated).
Paper-Trading Profit/Loss: $${profitAmount.toLocaleString()}.
SMC Confluence Score was rated at ${trade.confidenceScore}%. This record is stored for system learning, retrospective study, and performance modeling.`,
        tags: [trade.pair, trade.type, status.toLowerCase(), "simulated"],
        associatedPair: trade.pair,
        associatedTradeId: loggedTrade.id,
      });

    } catch (err: any) {
      setGlobalError(err.message || "Failed to compile simulation log.");
    }
  };

  const navigateToTab = (tab: string, pair?: string) => {
    setActiveTab(tab);
    if (pair) {
      setCurrentPair(pair);
      fetchMarketData(pair, currentTimeframe);
    }
  };

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard },
    { id: "analysis", icon: Sparkles },
    { id: "terminal", icon: LayoutGrid },
    { id: "reports", icon: BarChart3 },
    { id: "journal", icon: BookOpen },
    { id: "calculator", icon: Coins },
  ];

  return (
    <div className="min-h-screen bg-app-bg flex flex-col text-text-main pb-20 lg:pb-0 font-sans transition-colors duration-200">
      
      {/* Platform Header */}
      <Header theme={theme} onToggleTheme={() => setTheme(prev => prev === "light" ? "dark" : "light")} />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-row relative">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar activeTab={activeTab} onTabChange={(tab) => navigateToTab(tab)} />

        {/* Floating Bottom Navigation (Mobile) */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-card-bg/95 backdrop-blur-xl border border-border-custom rounded-2xl shadow-2xl p-2 flex justify-between items-center px-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToTab(item.id)}
                  className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    isActive 
                      ? "bg-blue-600/10 text-blue-500" 
                      : "text-text-sub hover:text-text-main"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Workspace Container */}
        {activeTab === "analysis" || activeTab === "terminal" ? (
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            {globalError && (
              <div className="m-4 lg:m-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-rose-400 font-semibold fade-in shadow-3xs">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold uppercase tracking-wider mb-0.5">System warning alert</div>
                  <div>{globalError}</div>
                </div>
                <button onClick={() => setGlobalError(null)} className="text-rose-400 hover:text-rose-300 font-bold px-1 text-sm">
                  ×
                </button>
              </div>
            )}
            
            {activeTab === "analysis" ? (
              <AnalysisWorkspace
                currentPair={currentPair}
                currentTimeframe={currentTimeframe}
                onPairChange={handlePairChange}
                onTimeframeChange={handleTimeframeChange}
                thesis={thesis}
                loadingAnalysis={loadingAnalysis}
                onLogTrade={handleLogTrade}
              />
            ) : (
              <SMCTerminal
                currentPair={currentPair}
                currentTimeframe={currentTimeframe}
                onPairChange={handlePairChange}
                onTimeframeChange={handleTimeframeChange}
                thesis={thesis}
                candles={candles}
                zones={zones}
                swingPoints={swingPoints}
                loadingAnalysis={loadingAnalysis}
                onTriggerAnalysis={handleTriggerAnalysis}
                onLogTrade={handleLogTrade}
                oandaDetails={oandaDetails}
              />
            )}
          </div>
        ) : (
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            
            {/* Error notifications */}
            {globalError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-rose-400 font-semibold fade-in shadow-3xs">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold uppercase tracking-wider mb-0.5">System warning alert</div>
                  <div>{globalError}</div>
                </div>
                <button onClick={() => setGlobalError(null)} className="text-rose-400 hover:text-rose-300 font-bold px-1 text-sm">
                  ×
                </button>
              </div>
            )}

            {/* Active Tab rendering */}
            {activeTab === "dashboard" && (
              <Dashboard
                stats={stats}
                recentTrades={tradeHistory}
                onNavigate={(tab, pair) => navigateToTab(tab, pair)}
              />
            )}

            {activeTab === "journal" && (
              <Journal
                entries={journalEntries}
                onAddEntry={handleAddJournalEntry}
                loadingAddEntry={loadingAddEntry}
                loadingJournal={loadingJournal}
                journalError={journalError}
              />
            )}

            {activeTab === "reports" && (
              <Reports
                stats={stats}
                tradeHistory={tradeHistory}
                loadingReports={loadingReports}
                reportsError={reportsError}
              />
            )}

            {activeTab === "calculator" && (
              <RiskCalculator
                accountBalance={accountBalance}
                setAccountBalance={setAccountBalance}
                riskPercentage={riskPercentage}
                setRiskPercentage={setRiskPercentage}
                currentPair={currentPair}
                onLogTrade={handleLogTrade}
              />
            )}

          </main>
        )}

      </div>
    </div>
  );
}
