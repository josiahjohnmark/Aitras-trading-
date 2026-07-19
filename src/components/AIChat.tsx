import React, { useState, useRef, useEffect } from "react";
import InstitutionalReport from "./InstitutionalReport";
import { Loader2, Send, UploadCloud, User, Cpu, Sparkles, Image, CheckCircle, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AIChatProps {
  chatHistory: Message[];
  onSendMessage: (message: string, specialist: string) => Promise<void>;
  onSendImage: (base64Image: string) => Promise<void>;
  loadingChat: boolean;
}

export default function AIChat({ chatHistory, onSendMessage, onSendImage, loadingChat }: AIChatProps) {
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("Chief Analyst");
  const [inputValue, setInputValue] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ status: "idle" | "loading" | "success" | "error"; msg?: string }>({ status: "idle" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    };

    // Smooth scroll immediately
    scrollToBottom();

    // Setup MutationObserver to scroll to bottom on any DOM changes inside the container (e.g., text, additions)
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also trigger on some key times to ensure layout has settled
    const timers = [
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 150),
      setTimeout(scrollToBottom, 300),
    ];

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [chatHistory, loadingChat]);

  const specialists = [
    { name: "Chief Analyst", role: "Synthesizer & Advisor", color: "bg-blue-500" },
    { name: "Market Analyst", role: "Price Action & SMC", color: "bg-emerald-500" },
    { name: "News Analyst", role: "Macro & Volatility", color: "bg-amber-500" },
    { name: "Risk Analyst", role: "Position Sizing & RR", color: "bg-rose-500" },
    { name: "Psychology Analyst", role: "Behavioral & Discipline", color: "bg-purple-500" },
  ];

  const suggestedPrompts = [
    "What is the current EURUSD trend alignment?",
    "Check for any impending high-impact economic news.",
    "Explain the mechanics of a bearish Order Block.",
    "Perform a quick discipline check on my recent trade logs.",
  ];

  const handleSend = (text?: string) => {
    const messageToSend = text || inputValue;
    if (!messageToSend.trim() || loadingChat) return;
    onSendMessage(messageToSend, selectedSpecialist);
    if (!text) setInputValue("");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadStatus({ status: "error", msg: "Please select a valid image file." });
      return;
    }
    
    setUploadStatus({ status: "loading" });
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      
      // Call vision handler on parent
      onSendImage(base64Data)
        .then(() => {
          setUploadStatus({ status: "success", msg: "Screenshot uploaded and analyzed!" });
          setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
        })
        .catch((err) => {
          setUploadStatus({ status: "error", msg: err.message || "Vision analysis failed." });
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start fade-in font-sans">
      
      {/* Left Column: Specialist Selectors and File Upload */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Specialty selection bento card */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-[#F8FAFC] text-sm mb-4 border-b pb-2">AITRAS Specialists</h3>
          <div className="space-y-2">
            {specialistPromptList(selectedSpecialist, (name) => setSelectedSpecialist(name))}
          </div>
        </div>

        {/* Vision Upload Card */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-2 mb-3">
            <Image className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Screenshot Analyzer</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
            Upload a workspace chart or trading platform screenshot (MT4, TradingView) to run vision validation.
          </p>

          {/* Drag & drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              dragActive
                ? "border-blue-500 bg-blue-50/50"
                : "border-[#334155] hover:border-blue-400 hover:bg-[#0B0F19]/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <UploadCloud className="mx-auto h-8 w-8 text-[#64748B] mb-2" />
            <span className="block text-xs font-bold text-[#E2E8F0]">Drag & Drop Screenshot</span>
            <span className="text-[10px] text-[#64748B] mt-1 block">or click to browse local files</span>
          </div>

          {/* Upload & analysis status indicators */}
          {uploadStatus.status !== "idle" && (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold ${
              uploadStatus.status === "loading"
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : uploadStatus.status === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}>
              {uploadStatus.status === "loading" && <Loader2 className="animate-spin h-4 w-4" />}
              {uploadStatus.status === "success" && <CheckCircle className="h-4 w-4" />}
              {uploadStatus.status === "error" && <AlertCircle className="h-4 w-4" />}
              <span>{uploadStatus.msg || "Vision Analyzer processing..."}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Chat History and inputs */}
      <div className="lg:col-span-2 flex flex-col bento-card border border-[#1E293B] rounded-xl shadow-2xs h-[600px]">
        {/* Top Active specialist indicator */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E293B] bg-[#0B0F19]/30">
          <div className={`h-2.5 w-2.5 rounded-full ${specialists.find(s => s.name === selectedSpecialist)?.color}`} />
          <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">{selectedSpecialist} is active</span>
        </div>

        {/* Chat History Panel */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full animate-pulse">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">Specialist Discussion Hub</h3>
                <p className="text-xs text-[#64748B] mt-1 max-w-[280px] leading-relaxed mx-auto">
                  Ask a question or select a suggested topic to converse with AITRAS.
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2 max-w-[360px] w-full mt-2 text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(p)}
                    className="text-xs font-medium text-[#94A3B8] bg-[#0B0F19] hover:bg-[#1E293B] border border-[#1E293B] p-2.5 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => {
              const isModel = msg.role === "model";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[95%] w-full ${isModel ? "self-start" : "self-end flex-row-reverse ml-auto"}`}
                >
                  <div className={`p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${
                    isModel ? "bg-blue-50 text-blue-600" : "bg-[#1E293B] text-[#94A3B8]"
                  }`}>
                    {isModel ? <Cpu className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  {isModel ? (
                    <div className="flex-1 min-w-0">
                      <InstitutionalReport
                        content={msg.content}
                        onSelectSuggestion={(prompt) => handleSend(prompt)}
                        isNewMessage={idx === chatHistory.length - 1 && loadingChat}
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl text-xs bg-blue-600 text-white font-medium shadow-3xs leading-relaxed max-w-[85%]">
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing/Loading indicator */}
          {loadingChat && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="p-2 rounded-lg h-8 w-8 flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                <Loader2 className="animate-spin h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl text-xs bg-[#0B0F19] border border-[#1E293B] text-[#64748B] font-medium">
                {selectedSpecialist} is compiling analysis report...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0B0F19]/50 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Query ${selectedSpecialist} regarding trading structure...`}
            disabled={loadingChat}
            className="flex-1 bento-card border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-blue-500 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loadingChat}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

function specialistPromptList(active: string, onSelect: (name: string) => void) {
  const specialists = [
    { name: "Chief Analyst", role: "Synthesizer & Advisor", color: "bg-blue-500", desc: "Coordinates all other specialists to deliver the unified, balanced final opinion." },
    { name: "Market Analyst", role: "Price Action & SMC", color: "bg-emerald-500", desc: "Monitors trend, market structure peaks, BOS, MSS, order blocks and FVGs." },
    { name: "News Analyst", role: "Macro & Volatility", color: "bg-amber-500", desc: "Tracks global calendars, fundamental releases and event-driven spikes." },
    { name: "Risk Analyst", role: "Position Sizing & RR", color: "bg-rose-500", desc: "Evaluates exact stop loss limits, portfolio drawdowns, and optimal sizing." },
    { name: "Psychology Analyst", role: "Behavioral & Discipline", color: "bg-purple-500", desc: "Monitors user behavior patterns, emotional biases and discipline logs." },
  ];

  return specialists.map((s) => (
    <div
      key={s.name}
      onClick={() => onSelect(s.name)}
      className={`cursor-pointer p-3 rounded-lg border transition-all ${
        active === s.name
          ? "border-blue-500/30 bg-blue-50/30 shadow-2xs"
          : "border-transparent hover:bg-[#0B0F19]/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
        <span className="text-xs font-bold text-[#F8FAFC]">{s.name}</span>
      </div>
      <p className="text-[10px] font-medium text-[#64748B] mt-0.5">{s.role}</p>
      {active === s.name && (
        <p className="text-[10px] text-[#94A3B8] leading-relaxed mt-2 pt-2 border-t border-[#1E293B] fade-in">
          {s.desc}
        </p>
      )}
    </div>
  ));
}
