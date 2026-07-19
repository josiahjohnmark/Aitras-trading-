import React, { useState, useEffect } from "react";
import { Cpu, Bell, Activity, Clock, Sun, Moon } from "lucide-react";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border-custom bg-card-bg/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 font-sans text-text-main">
      
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center p-2 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl shadow-md glow-blue">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 20L10 11L14 15L21 6" />
            <path d="M16 6h5v5" />
            <path d="M3 20h18" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-wider text-base uppercase bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">AITRAS</span>
            <span className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Cockpit</span>
          </div>
          <span className="text-[9px] text-text-sub font-bold tracking-widest uppercase block leading-none mt-0.5">
            INTELLIGENCE TERMINAL
          </span>
        </div>
      </div>

      {/* Stats and Time indicators */}
      <div className="flex items-center gap-4 text-xs">
        
        {/* Real-time UTC Sync */}
        <div className="hidden md:flex items-center gap-2 bg-input-bg border border-border-custom px-3 py-1.5 rounded-lg shadow-2xs text-text-main font-mono">
          <Clock className="h-3.5 w-3.5 text-text-sub" />
          <span className="font-bold text-[11px]">{utcTime}</span>
        </div>

        {/* Server status indicator */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-500 font-mono">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse glow-emerald" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">SECURE CONTEXT</span>
        </div>

        {/* Notifications, Theme, and Profile */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button 
            onClick={onToggleTheme}
            className="p-2 text-text-sub hover:text-text-main bg-input-bg hover:bg-card-bg border border-border-custom rounded-lg transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </button>

          <button className="p-2 text-text-sub hover:text-text-main bg-input-bg hover:bg-card-bg border border-border-custom rounded-lg transition-colors cursor-pointer relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full animate-ping" />
          </button>
          
          <div className="h-8 w-[1px] bg-border-custom mx-1" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              JO
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-text-main">Josiah John-mark</span>
              <span className="text-[9px] text-text-sub font-bold uppercase">Senior Trader</span>
            </div>
          </div>
        </div>

      </div>

    </header>
  );
}
