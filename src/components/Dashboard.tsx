import React, { useState, useEffect } from "react";
import { MarketBias, EconomicEvent, NewsArticle, TradeRecord } from "../types";
import { TrendingUp, TrendingDown, Clock, Calendar, Newspaper, ArrowRight, Award, DollarSign, Target, Activity, Loader2, Eye, AlertTriangle, Cpu, Zap } from "lucide-react";

interface DashboardProps {
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  recentTrades: TradeRecord[];
  onNavigate: (tab: string, pair?: string) => void;
}

interface MarketItem {
  pair: string;
  price: number;
  bias: MarketBias;
  change: string;
  status: "UP" | "DOWN";
}

interface ScanningAlert {
  id: string;
  pair: string;
  timeframe: string;
  pattern: string;
  details: string;
  type: "OB_TAP" | "FVG_FILL" | "LIQ_SWEEP" | "MSS_SHIFT";
  status: string;
  bias: MarketBias;
  price: number;
  timestamp: string;
}

interface MarketStatus {
  isOpen: boolean;
  reason: string;
  activeSessions: string[];
  utcTime: string;
  localTime: string;
}

export default function Dashboard({ stats, recentTrades, onNavigate }: DashboardProps) {
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  
  // Custom smart SMC integrations
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [scanningAlerts, setScanningAlerts] = useState<ScanningAlert[]>([]);
  const [loadingScanner, setLoadingScanner] = useState<boolean>(true);

  // TradingView state
  const [selectedChartPair, setSelectedChartPair] = useState<string>("EURUSD");
  const [selectedInterval, setSelectedInterval] = useState<string>("60");
  const [tvLoaded, setTvLoaded] = useState<boolean>(false);

  // Loading States
  const [loadingMarkets, setLoadingMarkets] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);

  // Error States
  const [errorMarkets, setErrorMarkets] = useState<string | null>(null);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorNews, setErrorNews] = useState<string | null>(null);

  // Fetch all data from APIs on mount
  useEffect(() => {
    // 1. Fetch Markets Summary
    setLoadingMarkets(true);
    setErrorMarkets(null);
    fetch("/api/markets-summary")
      .then((res) => {
        if (!res.ok) throw new Error("Connection failed");
        return res.json();
      })
      .then((data) => {
        setMarkets(data || []);
      })
      .catch((err) => {
        console.error("Failed to load markets:", err);
        setErrorMarkets("Waiting for market connection.");
      })
      .finally(() => setLoadingMarkets(false));

    // 2. Fetch Economic Calendar
    setLoadingEvents(true);
    setErrorEvents(null);
    fetch("/api/economic-calendar")
      .then((res) => {
        if (!res.ok) throw new Error("Connection failed");
        return res.json();
      })
      .then((data) => {
        setEconomicEvents(data || []);
      })
      .catch((err) => {
        console.error("Failed to load economic events:", err);
        setErrorEvents("Failed to load economic calendar.");
      })
      .finally(() => setLoadingEvents(false));

    // 3. Fetch News Articles
    setLoadingNews(true);
    setErrorNews(null);
    fetch("/api/news")
      .then((res) => {
        if (!res.ok) throw new Error("Connection failed");
        return res.json();
      })
      .then((data) => {
        setNewsArticles(data || []);
      })
      .catch((err) => {
        console.error("Failed to load news articles:", err);
        setErrorNews("Failed to load financial news.");
      })
      .finally(() => setLoadingNews(false));

    // 4. Fetch Market and Session Status
    fetch("/api/market/status")
      .then((res) => res.json())
      .then((data) => setMarketStatus(data))
      .catch((err) => console.error("Failed to fetch market status:", err));

    // 5. Fetch Active Autonomous Scanner alerts
    setLoadingScanner(true);
    fetch("/api/scanner/active")
      .then((res) => res.json())
      .then((data) => setScanningAlerts(data || []))
      .catch((err) => console.error("Failed to fetch scanner alerts:", err))
      .finally(() => setLoadingScanner(false));
  }, []);

  // TradingView setup
  useEffect(() => {
    let checkInterval = setInterval(() => {
      if (window.TradingView) {
        setTvLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!tvLoaded) return;
    const containerId = "dashboard_tv_chart";
    const elem = document.getElementById(containerId);
    if (!elem) return;

    elem.innerHTML = ""; // Clear existing

    let tvSymbol = "FX:EURUSD";
    if (selectedChartPair === "GBPUSD") tvSymbol = "FX:GBPUSD";
    else if (selectedChartPair === "USDJPY") tvSymbol = "FX:USDJPY";
    else if (selectedChartPair === "XAUUSD") tvSymbol = "OANDA:XAUUSD";

    try {
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: selectedInterval,
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f8fafc",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: containerId,
        studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates"]
      });
    } catch (e) {
      console.error("Dashboard TV initialization failed:", e);
    }
  }, [tvLoaded, selectedChartPair, selectedInterval]);

  return (
    <div className="flex flex-col gap-6 fade-in font-sans">
      {/* Welcome banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Real-time market summary, autonomous SMC scan triggers, and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {marketStatus && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              marketStatus.isOpen 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-600"
            }`}>
              <div className={`h-2 w-2 rounded-full ${marketStatus.isOpen ? "bg-[#22c55e] animate-ping" : "bg-[#ef4444]"}`}></div>
              <span>FOREX: {marketStatus.isOpen ? "LIVE" : "CLOSED"}</span>
              {marketStatus.activeSessions.length > 0 && (
                <span className="text-text-sub font-normal">
                  ({marketStatus.activeSessions.join(", ")})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Interactive TradingView Terminal */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-xs flex flex-col h-[520px]">
        <div className="flex flex-wrap items-center justify-between border-b border-[#1E293B] pb-3 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">TradingView Interactive Terminal</h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Pair picker */}
            <div className="flex gap-1 bg-[#090D16] p-1 rounded-lg border border-[#1E293B]">
              {["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedChartPair(p)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    selectedChartPair === p
                      ? "bg-blue-600 text-white"
                      : "text-text-sub hover:text-text-main"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Timeframe picker */}
            <div className="flex gap-1 bg-[#090D16] p-1 rounded-lg border border-[#1E293B]">
              {[
                { label: "M5", val: "5" },
                { label: "M15", val: "15" },
                { label: "H1", val: "60" },
                { label: "H4", val: "240" },
                { label: "D1", val: "D" },
              ].map((tf) => (
                <button
                  key={tf.val}
                  onClick={() => setSelectedInterval(tf.val)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    selectedInterval === tf.val
                      ? "bg-blue-600 text-white"
                      : "text-text-sub hover:text-text-main"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate("analysis", selectedChartPair)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Launch AI Analysis
            </button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0 w-full rounded-lg overflow-hidden bg-[#090D16] border border-[#1E293B]">
          <div id="dashboard_tv_chart" className="w-full h-full" />
        </div>
      </div>

      {/* Weekend Snapshot Alert */}
      {marketStatus && !marketStatus.isOpen && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-[#1e1b4b] border border-[#4338ca]/30 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#818cf8] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#f8fafc]">Weekend Snapshots Active (Market Closed)</h4>
              <p className="text-xs text-[#c7d2fe] mt-0.5 leading-relaxed">
                The international Forex market is closed. Live real-time price feeds represent Friday close extremes. 
                Standard signal algorithms are suspended. We highly recommend running the **SMC Bot Backtester** in the Performance tab to review historical cycle strategies!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("reports")}
            className="shrink-0 px-3.5 py-1.5 text-xs font-bold text-[#ffffff] bg-[#4f46e5] hover:bg-[#6366f1] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Launch Backtester →
          </button>
        </div>
      )}

      {/* SMC Autonomous Alerts Scanner Board */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">SMC Autonomous Scanner (Active Monitoring)</h3>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30 font-extrabold uppercase tracking-wider">
            No Prompts Required
          </span>
        </div>

        {loadingScanner ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Scanning candles for setups...</span>
          </div>
        ) : scanningAlerts.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#64748B]">
            No live structural shifts detected. Scanning ranges active.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scanningAlerts.map((alert) => {
              const isBull = alert.bias === MarketBias.BULLISH;
              const isBear = alert.bias === MarketBias.BEARISH;
              return (
                <div 
                  key={alert.id}
                  onClick={() => onNavigate("analysis", alert.pair)}
                  className="p-3.5 rounded-xl bg-[#090D16] border border-[#1E293B] hover:border-blue-500/30 transition-all cursor-pointer flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#F8FAFC]">{alert.pair}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#1E293B] text-[#94A3B8] rounded">
                          {alert.timeframe}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                        isBull ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30" : 
                        isBear ? "bg-rose-950/50 text-rose-400 border border-rose-900/30" : "bg-[#1E293B] text-[#94A3B8]"
                      }`}>
                        {alert.bias}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5">
                      <Zap className={`h-3.5 w-3.5 shrink-0 ${isBull ? "text-emerald-400" : isBear ? "text-rose-400" : "text-blue-400"}`} />
                      <h4 className="text-xs font-bold text-[#F8FAFC] line-clamp-1">{alert.pattern}</h4>
                    </div>

                    <p className="text-[11px] text-[#94A3B8] mt-1.5 leading-normal line-clamp-2">
                      {alert.details}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 border-t border-[#1E293B]/50 pt-2 text-[10px] font-mono">
                    <span className="text-[#64748B]">Trigger Price:</span>
                    <span className="font-bold text-[#F8FAFC]">
                      {alert.price.toFixed(alert.pair.includes("JPY") ? 2 : 5)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Ticker Bento Grid */}
      {loadingMarkets ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs animate-pulse h-[116px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-[#1E293B] rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : errorMarkets || markets.length === 0 ? (
        <div className="bento-card border border-[#1E293B] rounded-xl p-6 text-center text-[#64748B] text-xs shadow-2xs">
          Waiting for market connection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {markets.map((m) => {
            const isUp = m.status === "UP";
            return (
              <div
                key={m.pair}
                onClick={() => onNavigate("analysis", m.pair)}
                className="group cursor-pointer bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs hover:border-blue-500/30 hover:shadow-xs transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC] group-hover:text-blue-600 transition-colors">{m.pair}</span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {m.change}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-[#F8FAFC] mt-2">
                  {m.price.toFixed(m.pair.includes("JPY") ? 2 : 5)}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-[#64748B] font-medium">AITRAS Bias:</span>
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      m.bias === MarketBias.BULLISH ? "text-emerald-600" : m.bias === MarketBias.BEARISH ? "text-rose-600" : "text-[#94A3B8]"
                    }`}
                  >
                    {m.bias}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">${stats.netProfit.toLocaleString()}</div>
            <div className="text-xs font-medium text-[#64748B]">Net Profit History</div>
          </div>
        </div>
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.winRate}%</div>
            <div className="text-xs font-medium text-[#64748B]">Trading Win Rate</div>
          </div>
        </div>
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.totalTrades}</div>
            <div className="text-xs font-medium text-[#64748B]">Total Analyzed Trades</div>
          </div>
        </div>
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{stats.profitFactor}</div>
            <div className="text-xs font-medium text-[#64748B]">System Profit Factor</div>
          </div>
        </div>
      </div>

      {/* Main Bento Core: News & Economic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Economic Calendar Widget */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs lg:col-span-1">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Economic Calendar</h3>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">Today</span>
          </div>

          <div className="space-y-3.5">
            {loadingEvents ? (
              <div className="space-y-4 py-8 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                <span className="text-xs text-[#64748B] font-semibold">Syncing calendar...</span>
              </div>
            ) : errorEvents ? (
              <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 text-xs text-center font-semibold rounded-lg">
                {errorEvents}
              </div>
            ) : economicEvents.length === 0 ? (
              <div className="p-6 bg-[#0B0F19] border border-dashed border-[#334155] text-center text-[#64748B] text-xs font-medium rounded-lg leading-relaxed">
                No economic events scheduled.
              </div>
            ) : (
              economicEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B]/50 hover:bg-[#1E293B]/50 transition-colors"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#64748B] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {evt.time}
                      </span>
                      <span className="font-bold text-xs bg-gray-200/70 text-[#E2E8F0] px-1.5 py-0.5 rounded-sm">
                        {evt.currency}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#F8FAFC] line-clamp-1">{evt.event}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-[#94A3B8]">
                    <span>Act: <span className="font-bold text-rose-600">{evt.actual}</span></span>
                    <span>Fore: <span>{evt.forecast}</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => onNavigate("news")}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 rounded-lg transition-colors"
          >
            View Full Calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Live News Widget */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Financial News Feed</h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Real-Time</span>
          </div>

          <div className="space-y-4">
            {loadingNews ? (
              <div className="space-y-4 py-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                <span className="text-xs text-[#64748B] font-semibold">Acquiring live feed...</span>
              </div>
            ) : errorNews ? (
              <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 text-xs text-center font-semibold rounded-lg">
                {errorNews}
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="p-12 bg-[#0B0F19] border border-dashed border-[#334155] text-center text-[#64748B] text-xs font-medium rounded-lg leading-relaxed">
                No news articles available.
              </div>
            ) : (
              newsArticles.map((art) => (
                <div
                  key={art.id}
                  className="flex flex-col gap-1.5 border-b border-gray-50 last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">{art.source}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">{art.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] leading-snug hover:text-blue-600 cursor-pointer transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                    {art.summary}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      art.sentiment === "bullish" ? "bg-emerald-50 text-emerald-700" : art.sentiment === "bearish" ? "bg-rose-50 text-rose-700" : "bg-[#1E293B] text-[#94A3B8]"
                    }`}>
                      {art.sentiment}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${art.impact === "high" ? "text-rose-600" : "text-[#64748B]"}`}>
                      • {art.impact} impact
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Trade Executions logs */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#F8FAFC]">Recent Recommended Executions</h3>
          <button
            onClick={() => onNavigate("reports")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Trade Log <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5">ID</th>
                <th className="py-2.5">Pair</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Entry Price</th>
                <th className="py-2.5">Stop Loss</th>
                <th className="py-2.5">Take Profit</th>
                <th className="py-2.5">R:R</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono text-xs">
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B] text-xs font-medium bg-[#0B0F19]/30 rounded-lg">
                    No reports generated.
                  </td>
                </tr>
              ) : (
                recentTrades.slice(0, 5).map((tr) => (
                  <tr key={tr.id} className="hover:bg-[#0B0F19]/50 transition-colors">
                    <td className="py-3 font-semibold text-[#64748B]">{tr.id}</td>
                    <td className="py-3 font-bold text-[#F8FAFC]">{tr.pair}</td>
                    <td className={`py-3 font-extrabold ${tr.type === "BUY" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tr.type}
                    </td>
                    <td className="py-3 text-[#94A3B8]">{tr.entryPrice.toFixed(tr.pair.includes("JPY") ? 2 : 5)}</td>
                    <td className="py-3 text-[#94A3B8]">{tr.stopLoss.toFixed(tr.pair.includes("JPY") ? 2 : 5)}</td>
                    <td className="py-3 text-[#94A3B8]">{tr.takeProfit.toFixed(tr.pair.includes("JPY") ? 2 : 5)}</td>
                    <td className="py-3 text-[#94A3B8]">1:{tr.riskToReward}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
