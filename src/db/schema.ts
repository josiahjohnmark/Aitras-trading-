import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").default("light").notNull(),
  riskTolerance: text("risk_tolerance").default("medium").notNull(),
  defaultLotSize: text("default_lot_size").default("0.1").notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal table
export const journal = pgTable("journal", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "daily" | "trade" | "learning"
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").notNull(), // Comma-separated or JSON string
  associatedTradeId: text("associated_trade_id"),
  timestamp: text("timestamp").notNull(), // ISO string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winningTrades: integer("winning_trades").default(0).notNull(),
  losingTrades: integer("losing_trades").default(0).notNull(),
  winRate: integer("win_rate").default(0).notNull(),
  netProfit: doublePrecision("net_profit").default(0.0).notNull(),
  profitFactor: doublePrecision("profit_factor").default(0.0).notNull(),
  tradesJson: text("trades_json").default("[]").notNull(), // JSON string representing trade history
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MarketAnalysis table
export const marketAnalysis = pgTable("market_analysis", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
  timeframe: text("timeframe").notNull(),
  bias: text("bias").notNull(), // "BULLISH" | "BEARISH" | "NEUTRAL"
  keyLevelsJson: text("key_levels_json").notNull(), // JSON string of support/resistance
  suggestedTradeJson: text("suggested_trade_json"), // JSON string of target trade
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AIConversations table
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  specialist: text("specialist").notNull(), // "HTF Analyst", "Risk Manager", etc.
  messagesJson: text("messages_json").default("[]").notNull(), // JSON string representing message array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AIMemory table
export const aiMemory = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// LearningRecords table
export const learningRecords = pgTable("learning_records", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  score: integer("score").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// BacktestingRecords table
export const backtestingRecords = pgTable("backtesting_records", {
  id: serial("id").primaryKey(),
  strategyName: text("strategy_name").notNull(),
  pair: text("pair").notNull(),
  timeframe: text("timeframe").notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winRate: doublePrecision("win_rate").default(0.0).notNull(),
  netProfit: doublePrecision("net_profit").default(0.0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// UploadedScreenshots table
export const uploadedScreenshots = pgTable("uploaded_screenshots", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  analysisText: text("analysis_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SystemLogs table
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // "info" | "warn" | "error"
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
