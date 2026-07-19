import fs from "fs";
import path from "path";

// File path for the JSON database
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read and write database collections
interface DatabaseSchema {
  settings: any[];
  journal: any[];
  reports: any[];
  marketAnalysis: any[];
  aiConversations: any[];
  aiMemory: any[];
  learningRecords: any[];
  backtestingRecords: any[];
  uploadedScreenshots: any[];
  systemLogs: any[];
}

const getInitialDb = (): DatabaseSchema => ({
  settings: [],
  journal: [],
  reports: [],
  marketAnalysis: [],
  aiConversations: [],
  aiMemory: [],
  learningRecords: [],
  backtestingRecords: [],
  uploadedScreenshots: [],
  systemLogs: []
});

// Asynchronous locks to prevent parallel write corruption
let isWriting = false;
const writeQueue: Array<() => void> = [];

const acquireWriteLock = (): Promise<void> => {
  if (!isWriting) {
    isWriting = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    writeQueue.push(resolve);
  });
};

const releaseWriteLock = () => {
  if (writeQueue.length > 0) {
    const next = writeQueue.shift();
    if (next) next();
  } else {
    isWriting = false;
  }
};

async function readDb(): Promise<DatabaseSchema> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = await fs.promises.readFile(DB_FILE, "utf8");
    return JSON.parse(content || JSON.stringify(getInitialDb()));
  } catch (err) {
    console.error("Error reading JSON database file, returning empty schema:", err);
    return getInitialDb();
  }
}

async function writeDb(data: DatabaseSchema): Promise<void> {
  await acquireWriteLock();
  try {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to JSON database file:", err);
  } finally {
    releaseWriteLock();
  }
}

// ==========================================
// 1. Settings Services
// ==========================================
export async function getSettings() {
  const db = await readDb();
  if (db.settings.length === 0) {
    const defaultRecord = {
      id: 1,
      theme: "dark", // Defaulting to dark theme as requested
      riskTolerance: "medium",
      defaultLotSize: "0.1",
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.settings.push(defaultRecord);
    await writeDb(db);
    return defaultRecord;
  }
  return db.settings[0];
}

export async function saveSettings(
  data: { theme?: string; riskTolerance?: string; defaultLotSize?: string; notificationsEnabled?: boolean }
) {
  const db = await readDb();
  const current = await getSettings();
  const index = db.settings.findIndex((s) => s.id === current.id);
  
  const updated = {
    ...db.settings[index],
    ...(data.theme !== undefined && { theme: data.theme }),
    ...(data.riskTolerance !== undefined && { riskTolerance: data.riskTolerance }),
    ...(data.defaultLotSize !== undefined && { defaultLotSize: data.defaultLotSize }),
    ...(data.notificationsEnabled !== undefined && { notificationsEnabled: data.notificationsEnabled }),
    updatedAt: new Date().toISOString()
  };

  db.settings[index] = updated;
  await writeDb(db);
  return updated;
}

// ==========================================
// 2. Journal Services
// ==========================================
export async function getJournalEntries() {
  const db = await readDb();
  // Sort by createdAt descending (using ISO strings)
  return [...db.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createJournalEntry(
  data: { type: string; title: string; content: string; tags: string; associatedTradeId?: string | null; timestamp: string }
) {
  const db = await readDb();
  const nextId = db.journal.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const entry = {
    id: nextId,
    type: data.type,
    title: data.title,
    content: data.content,
    tags: data.tags,
    associatedTradeId: data.associatedTradeId || null,
    timestamp: data.timestamp,
    createdAt: new Date().toISOString()
  };

  db.journal.push(entry);
  await writeDb(db);
  return entry;
}

export async function deleteJournalEntry(entryId: number) {
  const db = await readDb();
  const index = db.journal.findIndex((j) => j.id === entryId);
  if (index === -1) return null;
  const deleted = db.journal.splice(index, 1)[0];
  await writeDb(db);
  return deleted;
}

// ==========================================
// 3. Reports Services
// ==========================================
export async function getReports() {
  const db = await readDb();
  return [...db.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReport(
  data: { totalTrades: number; winningTrades: number; losingTrades: number; winRate: number; netProfit: number; profitFactor: number; tradesJson?: string }
) {
  const db = await readDb();
  const nextId = db.reports.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const report = {
    id: nextId,
    totalTrades: data.totalTrades,
    winningTrades: data.winningTrades,
    losingTrades: data.losingTrades,
    winRate: data.winRate,
    netProfit: data.netProfit,
    profitFactor: data.profitFactor,
    tradesJson: data.tradesJson ?? "[]",
    createdAt: new Date().toISOString()
  };

  db.reports.push(report);
  await writeDb(db);
  return report;
}

// ==========================================
// 4. MarketAnalysis Services
// ==========================================
export async function getMarketAnalysis() {
  const db = await readDb();
  return [...db.marketAnalysis].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMarketAnalysis(
  data: { pair: string; timeframe: string; bias: string; keyLevelsJson: string; suggestedTradeJson?: string | null }
) {
  const db = await readDb();
  const nextId = db.marketAnalysis.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const analysis = {
    id: nextId,
    pair: data.pair,
    timeframe: data.timeframe,
    bias: data.bias,
    keyLevelsJson: data.keyLevelsJson,
    suggestedTradeJson: data.suggestedTradeJson || null,
    createdAt: new Date().toISOString()
  };

  db.marketAnalysis.push(analysis);
  await writeDb(db);
  return analysis;
}

// ==========================================
// 5. AIConversations Services
// ==========================================
export async function getConversations() {
  const db = await readDb();
  return [...db.aiConversations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveConversation(
  specialist: string,
  messagesJson: string
) {
  const db = await readDb();
  const nextId = db.aiConversations.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const conversation = {
    id: nextId,
    specialist,
    messagesJson,
    createdAt: new Date().toISOString()
  };

  db.aiConversations.push(conversation);
  await writeDb(db);
  return conversation;
}

// ==========================================
// 6. AIMemory Services
// ==========================================
export async function getMemory() {
  const db = await readDb();
  return db.aiMemory;
}

export async function setMemoryKey(key: string, value: string) {
  const db = await readDb();
  const existingIndex = db.aiMemory.findIndex((m) => m.key === key);
  
  const memoryItem = {
    id: existingIndex !== -1 ? db.aiMemory[existingIndex].id : db.aiMemory.reduce((max, m) => (m.id > max ? m.id : max), 0) + 1,
    key,
    value,
    createdAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    db.aiMemory[existingIndex] = memoryItem;
  } else {
    db.aiMemory.push(memoryItem);
  }

  await writeDb(db);
  return memoryItem;
}

// ==========================================
// 7. LearningRecords Services
// ==========================================
export async function getLearningRecords() {
  const db = await readDb();
  return [...db.learningRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createLearningRecord(
  data: { topic: string; score: number; notes?: string | null }
) {
  const db = await readDb();
  const nextId = db.learningRecords.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const record = {
    id: nextId,
    topic: data.topic,
    score: data.score,
    notes: data.notes || null,
    createdAt: new Date().toISOString()
  };

  db.learningRecords.push(record);
  await writeDb(db);
  return record;
}

// ==========================================
// 8. BacktestingRecords Services
// ==========================================
export async function getBacktestingRecords() {
  const db = await readDb();
  return [...db.backtestingRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createBacktestingRecord(
  data: { strategyName: string; pair: string; timeframe: string; totalTrades: number; winRate: number; netProfit: number }
) {
  const db = await readDb();
  const nextId = db.backtestingRecords.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const record = {
    id: nextId,
    strategyName: data.strategyName,
    pair: data.pair,
    timeframe: data.timeframe,
    totalTrades: data.totalTrades,
    winRate: data.winRate,
    netProfit: data.netProfit,
    createdAt: new Date().toISOString()
  };

  db.backtestingRecords.push(record);
  await writeDb(db);
  return record;
}

// ==========================================
// 9. UploadedScreenshots Services
// ==========================================
export async function getScreenshots() {
  const db = await readDb();
  return [...db.uploadedScreenshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveScreenshot(
  url: string,
  analysisText?: string | null
) {
  const db = await readDb();
  const nextId = db.uploadedScreenshots.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  
  const screenshot = {
    id: nextId,
    url,
    analysisText: analysisText || null,
    createdAt: new Date().toISOString()
  };

  db.uploadedScreenshots.push(screenshot);
  await writeDb(db);
  return screenshot;
}

// ==========================================
// 10. SystemLogs Services
// ==========================================
export async function createSystemLog(level: string, message: string) {
  try {
    const db = await readDb();
    const nextId = db.systemLogs.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
    
    const log = {
      id: nextId,
      level,
      message,
      timestamp: new Date().toISOString()
    };

    db.systemLogs.push(log);
    await writeDb(db);
    return log;
  } catch (err) {
    console.error("Failed to write to system logs JSON database:", err);
    return null;
  }
}

export async function getSystemLogs(limitCount = 100) {
  const db = await readDb();
  return [...db.systemLogs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limitCount);
}
