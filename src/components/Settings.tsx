import React, { useState } from "react";
import { Shield, Key, Sliders, User, Percent, DollarSign, Database, BrainCircuit } from "lucide-react";

interface SettingsProps {
  riskPercentage: number;
  onRiskChange: (val: number) => void;
  accountBalance: number;
  onBalanceChange: (val: number) => void;
}

export default function Settings({
  riskPercentage,
  onRiskChange,
  accountBalance,
  onBalanceChange,
}: SettingsProps) {
  const [modelType, setModelType] = useState<string>("gemini-3.5-flash");
  const [temp, setTemp] = useState<number>(0.2);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in font-sans">
      <div className="border-b border-[#1E293B] pb-3">
        <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">System Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Configure your risk models, AI endpoints, and secure credentials.</p>
      </div>

      {/* Account Profile Card */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3 mb-4">
          <User className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#F8FAFC]">Trader Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-[#64748B] uppercase text-[9px]">Account Email</span>
            <span className="font-mono font-bold text-[#E2E8F0] bg-[#0B0F19] border border-[#1E293B]/50 px-3 py-2 rounded-lg">
              josiahjohnmark9@gmail.com
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-[#64748B] uppercase text-[9px]">Authorization Group</span>
            <span className="font-mono font-bold text-[#E2E8F0] bg-[#0B0F19] border border-[#1E293B]/50 px-3 py-2 rounded-lg">
              Lead Software Engineer // AITRAS-HQ
            </span>
          </div>
        </div>
      </div>

      {/* Risk Metrics Configuration Card */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3 mb-4">
          <Sliders className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#F8FAFC]">Risk & Portfolio Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#64748B] uppercase flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-[#64748B]" /> Default Account Balance ($)
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => onBalanceChange(Number(e.target.value))}
              className="font-mono text-xs border border-[#334155] rounded-lg px-3 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 font-bold bg-[#0B0F19]/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#64748B] uppercase flex items-center gap-1">
              <Percent className="h-3 w-3 text-[#64748B]" /> Risk Per Trade (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={riskPercentage}
              onChange={(e) => onRiskChange(Number(e.target.value))}
              className="font-mono text-xs border border-[#334155] rounded-lg px-3 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 font-bold bg-[#0B0F19]/50"
            />
          </div>
        </div>
      </div>

      {/* AI Cognitive & Engine Config */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3 mb-4">
          <BrainCircuit className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#F8FAFC]">AI Intelligence Config</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Primary Model Endpoint</span>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="text-xs border border-[#334155] rounded-lg px-3 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 font-bold cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Cheapest/Fastest)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex Reasoning)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Model Temperature ({temp})</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="mt-2.5 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Secure API Credentials Card */}
      <div className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#F8FAFC]">API Key Security</h3>
        </div>

        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs leading-relaxed text-[#94A3B8]">
          <Key className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            We’ve updated your app’s Gemini API calls to our recommended full-stack server-side architecture. Your Gemini API key is stored securely in the **Settings &gt; Secrets** panel and never exposed to the client browser.
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mt-4">
        {saveSuccess ? (
          <div className="py-2.5 px-6 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 fade-in">
            ✓ System Settings Updated
          </div>
        ) : (
          <button
            onClick={handleSave}
            className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            Save All Configurations
          </button>
        )}
      </div>
    </div>
  );
}
