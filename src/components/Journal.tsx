import React, { useState } from "react";
import { JournalEntry } from "../types";
import { BookOpen, Search, Plus, Filter, Calendar, Tag, ChevronDown, CheckCircle, Loader2 } from "lucide-react";

interface JournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => Promise<void>;
  loadingAddEntry: boolean;
  loadingJournal?: boolean;
  journalError?: string | null;
}

export default function Journal({ entries, onAddEntry, loadingAddEntry, loadingJournal, journalError }: JournalProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "daily" | "trade" | "learning">("all");
  const [searchQuery, setSearchValue] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  if (loadingJournal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Syncing journaling indices...</p>
      </div>
    );
  }

  if (journalError) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center text-rose-700 text-xs font-semibold font-sans">
        {journalError}
      </div>
    );
  }

  // Form states
  const [newType, setNewType] = useState<"daily" | "trade" | "learning">("daily");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newTagsStr, setNewTagsStr] = useState<string>("");
  const [associatedPair, setAssociatedPair] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    try {
      await onAddEntry({
        type: newType,
        title: newTitle,
        content: newContent,
        tags: parsedTags,
        associatedPair: associatedPair || undefined,
      });

      // Clear form
      setNewTitle("");
      setNewContent("");
      setNewTagsStr("");
      setAssociatedPair("");
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowAddForm(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and search entries
  const filteredEntries = entries.filter((ent) => {
    const matchesFilter = activeFilter === "all" || ent.type === activeFilter;
    const matchesSearch =
      ent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start fade-in font-sans">
      
      {/* Left Column: Filters and Write Log form */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Filters Bento Card */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Filter Logs</h3>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { id: "all", label: "All Logs", color: "text-blue-600 bg-blue-50/50 border-blue-200" },
              { id: "daily", label: "Daily Reviews", color: "text-emerald-600 bg-emerald-50/50 border-emerald-200" },
              { id: "trade", label: "Trade Journals", color: "text-purple-600 bg-purple-50/50 border-purple-200" },
              { id: "learning", label: "Learning Lessons", color: "text-amber-600 bg-amber-50/50 border-amber-200" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? f.color
                    : "border-transparent text-[#94A3B8] hover:bg-[#0B0F19]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compose Log Bento Card */}
        <div className="bento-card border border-[#1E293B] rounded-xl p-4 shadow-2xs">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create New Log Entry
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 fade-in">
              <h3 className="text-sm font-bold text-[#F8FAFC] border-b border-gray-50 pb-2">New Journal Entry</h3>

              {/* Type Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Log Category</label>
                <div className="relative">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-xs border border-[#334155] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 appearance-none font-semibold cursor-pointer"
                  >
                    <option value="daily">Daily Review</option>
                    <option value="trade">Trade Journal</option>
                    <option value="learning">Learning Lesson</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., EURUSD London Breakout"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-[#334155] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 font-semibold"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Log Body / Observations</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your reasoning, psychological thoughts, or market lessons..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs border border-[#334155] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 leading-relaxed font-semibold resize-none"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., EURUSD, OB, Win"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="w-full text-xs border border-[#334155] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 font-semibold"
                />
              </div>

              {/* Associated pair */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Associated Pair (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., EURUSD"
                  value={associatedPair}
                  onChange={(e) => setAssociatedPair(e.target.value)}
                  className="w-full text-xs border border-[#334155] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-blue-500 bg-[#0B0F19]/50 font-semibold"
                />
              </div>

              {submitSuccess ? (
                <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100 fade-in">
                  <CheckCircle className="h-4 w-4" /> Entry Saved Successfully
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 text-xs font-semibold text-[#94A3B8] hover:bg-[#0B0F19] border border-[#334155] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAddEntry}
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:bg-blue-300"
                  >
                    Save Log
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Search bar and Logs list */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search journal entries by title, tags, or content..."
            className="w-full bento-card border border-[#1E293B] rounded-xl px-10 py-3 text-xs text-[#F8FAFC] shadow-2xs focus:outline-none focus:border-blue-500"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#64748B]" />
        </div>

        {/* Logs List */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bento-card border border-[#1E293B] rounded-xl p-8 text-center text-[#64748B] text-xs font-sans">
              No journal entries.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bento-card border border-[#1E293B] rounded-xl p-8 text-center text-[#64748B] text-xs font-sans">
              No matching journal entries found. Compose a new log above.
            </div>
          ) : (
            filteredEntries.map((ent) => (
              <div
                key={ent.id}
                className="bento-card border border-[#1E293B] rounded-xl p-5 shadow-2xs hover:border-[#334155] transition-all fade-in flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      ent.type === "daily"
                        ? "bg-emerald-50 text-emerald-700"
                        : ent.type === "trade"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {ent.type === "daily" ? "Daily Review" : ent.type === "trade" ? "Trade Journal" : "Learning Lesson"}
                    </span>
                    {ent.associatedPair && (
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded">
                        {ent.associatedPair}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] flex items-center gap-1 font-bold">
                    <Calendar className="h-3 w-3" /> {formatDate(ent.timestamp)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#F8FAFC] leading-snug">{ent.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line font-medium">{ent.content}</p>

                {ent.tags && ent.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Tag className="h-3 w-3 text-gray-300" />
                    {ent.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-sans font-bold text-[#64748B] bg-[#0B0F19] border border-[#1E293B] px-2 py-0.5 rounded-md hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
