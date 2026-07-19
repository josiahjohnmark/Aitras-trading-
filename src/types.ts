export enum MarketBias {
  BULLISH = "BULLISH",
  BEARISH = "BEARISH",
  NEUTRAL = "NEUTRAL",
  TRANSITIONAL = "TRANSITIONAL",
}

export enum ConfidenceLevel {
  VERY_HIGH = "VERY_HIGH",
  HIGH = "HIGH",
  MODERATE = "MODERATE",
  LOW = "LOW",
  VERY_LOW = "VERY_LOW",
}

export enum TradingSession {
  SYDNEY = "Sydney",
  TOKYO = "Tokyo",
  LONDON = "London",
  NEW_YORK = "New York",
  OVERLAP = "LDN-NY Overlap",
}

export interface SwingPoint {
  id: string;
  type: "high" | "low";
  price: number;
  timeIndex: number;
  strength: "strong" | "weak" | "protected" | "normal";
}

export interface TechnicalZone {
  id: string;
  type: "order_block" | "fvg" | "liquidity";
  subType?: "bullish" | "bearish" | "internal" | "external" | "buy_side" | "sell_side" | "equal_high" | "equal_low";
  priceStart: number;
  priceEnd: number;
  timeframe: string;
  isMitigated: boolean;
  confidence: number;
}

export interface ConfluenceFactor {
  name: string;
  aligned: boolean;
  details: string;
  weight: number;
}

export interface MarketThesis {
  id: string;
  pair: string;
  timeframe: string;
  bias: MarketBias;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  summary: string;
  supportingEvidence: string[];
  opposingEvidence: string[];
  keyLevels: {
    equilibrium: number;
    premiumBoundary: number;
    discountBoundary: number;
    protectedHigh?: number;
    protectedLow?: number;
  };
  scenarios: {
    primary: string;
    alternative: string;
    invalidation: string;
  };
  suggestedTrade?: {
    type: "BUY" | "SELL";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskToReward: number;
  };
  timeframeAnalysis?: {
    MN: string;
    W1: string;
    D1: string;
    H4: string;
    H1: string;
    M15: string;
    M5: string;
    M1?: string;
  };
  verification?: {
    approved: boolean;
    status: "Approved" | "Monitor" | "Wait" | "Reinvestigate" | "Reject";
    checklist: {
      higherTimeframeBias: boolean;
      marketStructureAnalyzed: boolean;
      liquidityInvestigated: boolean;
      orderBlockOrFvgChecked: boolean;
      premiumDiscountChecked: boolean;
      riskToRewardSatisfied: boolean;
      stopLossDefined: boolean;
      takeProfitDefined: boolean;
      newsChecked: boolean;
    };
    errors: string[];
    warnings: string[];
  };
  timestamp: string;
}

export interface TradeRecord {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskToReward: number;
  confidenceScore: number;
  status: "PENDING" | "ACTIVE" | "WIN" | "LOSS" | "CANCELLED";
  profitAmount?: number;
  exitPrice?: number;
  notes?: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  type: "daily" | "trade" | "learning";
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
  associatedPair?: string;
  associatedTradeId?: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  importance: "high" | "medium" | "low";
  actual: string;
  forecast: string;
  previous: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  impact: "high" | "medium" | "low";
}
