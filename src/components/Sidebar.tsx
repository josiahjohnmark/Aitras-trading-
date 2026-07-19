import React from "react";
import { LayoutDashboard, Sparkles, BookOpen, BarChart3, ShieldAlert, Coins, LayoutGrid } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analysis", label: "AI Cockpit", icon: Sparkles },
    { id: "terminal", label: "SMC Terminal", icon: LayoutGrid },
    { id: "reports", label: "Performance", icon: BarChart3 },
    { id: "journal", label: "Trading Journal", icon: BookOpen },
    { id: "calculator", label: "Risk Calculator", icon: Coins },
  ];

  return (
    <aside id="root-sidebar" className="w-64 shrink-0 border-r border-border-custom hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 p-4 justify-between font-sans bg-sidebar-bg transition-colors duration-200">
      
      {/* Menu Options */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold text-text-sub uppercase tracking-widest pl-3 block mb-3">
          SYSTEM CONSOLE
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-text-sub hover:text-text-main hover:bg-input-bg"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Safety / Compliance disclaimer element */}
      <div className="p-3 bg-input-bg border border-border-custom rounded-xl transition-colors duration-200">
        <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>RESEARCH & ANALYSIS ONLY</span>
        </div>
        <p className="text-[10px] text-text-sub leading-relaxed font-semibold">
          AITRAS is an institutional decision-support and research system. It has no live linkage to MT4, MT5, or any brokerage execution platform. All logged setups are simulated for study, journaling, and retrospective analysis only.
        </p>
      </div>

    </aside>
  );
}
