import { STRATEGY_PHILOSOPHY, TOP_DOWN_ANALYSIS } from "../methodology.js";

export interface VerificationResult {
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
}

export class MethodologyManager {
  public static readonly STRATEGY_PHILOSOPHY = STRATEGY_PHILOSOPHY;
  public static readonly TOP_DOWN_ANALYSIS = TOP_DOWN_ANALYSIS;

  /**
   * Verifies an analysis thesis against foundational trading principles.
   */
  public static verifyAnalysis(thesis: any): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const checklist = {
      higherTimeframeBias: false,
      marketStructureAnalyzed: false,
      liquidityInvestigated: false,
      orderBlockOrFvgChecked: false,
      premiumDiscountChecked: false,
      riskToRewardSatisfied: false,
      stopLossDefined: false,
      takeProfitDefined: false,
      newsChecked: false,
    };

    if (!thesis) {
      return {
        approved: false,
        status: "Reject",
        checklist,
        errors: ["Thesis object is null or undefined."],
        warnings: []
      };
    }

    // 1. Verify Higher Timeframe Bias (Top-Down sequence)
    if (thesis.timeframeAnalysis) {
      const tf = thesis.timeframeAnalysis;
      if (tf.MN && tf.W1 && tf.D1) {
        checklist.higherTimeframeBias = true;
      } else {
        errors.push("Missing critical macro timeframes (MN, W1, D1) required by Top-Down Framework.");
      }
    } else {
      errors.push("Missing Top-Down Multi-Timeframe Analysis Matrix.");
    }

    // 2. Verify Market Structure Analysis
    const textBody = `${thesis.coreThesis || ""} ${thesis.supportingEvidence?.join(" ") || ""} ${thesis.conflictingEvidence?.join(" ") || ""}`.toLowerCase();
    if (textBody.includes("structure") || textBody.includes("bos") || textBody.includes("mss") || textBody.includes("trend")) {
      checklist.marketStructureAnalyzed = true;
    } else {
      errors.push("No explicit Market Structure analysis found in thesis text.");
    }

    // 3. Verify Liquidity Analysis
    if (textBody.includes("liquidity") || textBody.includes("sweep") || textBody.includes("bsl") || textBody.includes("ssl") || textBody.includes("equal highs") || textBody.includes("equal lows")) {
      checklist.liquidityInvestigated = true;
    } else {
      errors.push("Liquidity pools and sweeps must be explicitly analyzed.");
    }

    // 4. Verify Order Block / FVG
    if (textBody.includes("order block") || textBody.includes("ob ") || textBody.includes("fvg") || textBody.includes("gap") || textBody.includes("imbalance")) {
      checklist.orderBlockOrFvgChecked = true;
    } else {
      warnings.push("No Order Block or Fair Value Gap confluence detected in thesis.");
    }

    // 5. Verify Premium & Discount Valuation
    if (textBody.includes("premium") || textBody.includes("discount") || textBody.includes("equilibrium") || textBody.includes("dealing range")) {
      checklist.premiumDiscountChecked = true;
    } else {
      warnings.push("Dealing range valuation (Premium / Discount) not clearly specified.");
    }

    // 6. Verify Stop Loss & Take Profit (Risk Management)
    const trade = thesis.suggestedTrade;
    if (trade) {
      if (typeof trade.stopLoss === "number" && trade.stopLoss > 0) {
        checklist.stopLossDefined = true;
      } else {
        errors.push("A logical Stop-Loss is non-negotiably required before trade entry.");
      }

      if (typeof trade.takeProfit === "number" && trade.takeProfit > 0) {
        checklist.takeProfitDefined = true;
      } else {
        errors.push("A logical Take-Profit target is non-negotiably required.");
      }

      // 7. Verify Risk-to-Reward Ratio (Minimum standard 1:3)
      if (typeof trade.riskToReward === "number" && trade.riskToReward >= 3.0) {
        checklist.riskToRewardSatisfied = true;
      } else {
        errors.push("Minimum acceptable Risk-to-Reward ratio is 1:3. Got: " + (trade.riskToReward || "None"));
      }
    } else {
      // It's fine if there is no setup suggested, but it must be explicitly a "Wait" or "Monitor" scenario
      checklist.stopLossDefined = true;
      checklist.takeProfitDefined = true;
      checklist.riskToRewardSatisfied = true;
      warnings.push("No active trade suggested. Reviewing context for 'Wait' or 'Monitor' state.");
    }

    // 8. Verify Economic News calendar check
    if (textBody.includes("news") || textBody.includes("economic") || textBody.includes("calendar") || textBody.includes("announcement") || textBody.includes("event") || textBody.includes("schedule")) {
      checklist.newsChecked = true;
    } else {
      warnings.push("Analysis did not explicitly evaluate upcoming high-impact economic calendar events.");
    }

    // Determine final status
    let status: "Approved" | "Monitor" | "Wait" | "Reinvestigate" | "Reject" = "Approved";
    
    if (errors.length > 0) {
      status = "Reject";
    } else if (warnings.length > 0) {
      status = "Monitor";
    }

    // If there is no suggested trade, it should be a wait status
    if (!trade && status === "Approved") {
      status = "Wait";
    }

    return {
      approved: errors.length === 0,
      status,
      checklist,
      errors,
      warnings,
    };
  }
}
