import type {
  AnomalyCandidate,
  AnomalySeverity,
  OutletAttention,
  OutletSignal,
  RuleCode,
  RuleEvaluation
} from "@barops/shared-types";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

type RuleThresholds = {
  stockVarianceAmber: number;
  stockVarianceRed: number;
  ownBaselineAmber: number;
  ownBaselineRed: number;
  peerDeviationAmber: number;
  peerDeviationRed: number;
  lateUploadsAmber: number;
  lateUploadsRed: number;
  correctionCount7dAmber: number;
  correctionCount7dRed: number;
  correctionChainRed: number;
  premiumMixSpikeAmber: number;
  premiumMixSpikeRed: number;
  topBrandDropAmber: number;
  topBrandDropRed: number;
  riskAvgAmber: number;
  riskAvgRed: number;
  unresolvedAnomaliesAmber: number;
  unresolvedAnomaliesRed: number;
};

export const DEFAULT_THRESHOLDS: RuleThresholds = {
  stockVarianceAmber: 3,
  stockVarianceRed: 7,
  ownBaselineAmber: 20,
  ownBaselineRed: 35,
  peerDeviationAmber: 15,
  peerDeviationRed: 30,
  lateUploadsAmber: 2,
  lateUploadsRed: 4,
  correctionCount7dAmber: 2,
  correctionCount7dRed: 4,
  correctionChainRed: 3,
  premiumMixSpikeAmber: 8,
  premiumMixSpikeRed: 15,
  topBrandDropAmber: 20,
  topBrandDropRed: 35,
  riskAvgAmber: 45,
  riskAvgRed: 70,
  unresolvedAnomaliesAmber: 3,
  unresolvedAnomaliesRed: 6
};

type EngineOptions = {
  baseRiskScore?: number;
  thresholds?: Partial<RuleThresholds>;
};

function scoreBand(score: number): "GREEN" | "AMBER" | "RED" {
  if (score >= 75) {
    return "RED";
  }
  if (score >= 45) {
    return "AMBER";
  }
  return "GREEN";
}

function severityFromRuleHit(isRed: boolean): AnomalySeverity {
  return isRed ? "HIGH" : "MEDIUM";
}

function buildRuleHit(
  ruleCode: RuleCode,
  severity: AnomalySeverity,
  riskScoreDelta: number,
  explanation: string,
  managementExplanation: string,
  confidenceScore: number,
  financialImpactEstimate: number | null = null
): RuleEvaluation {
  return {
    ruleCode,
    severity,
    status: "OPEN",
    riskScoreDelta,
    explanation,
    managementExplanation,
    financialImpactEstimate,
    confidenceScore
  };
}

function evaluateRules(signal: OutletSignal, thresholds: RuleThresholds): RuleEvaluation[] {
  const matches: RuleEvaluation[] = [];
  const stockVariance = Math.abs(signal.stockVariancePercent ?? 0);
  const ownDeviation = Math.abs(signal.ownBaselineDeviationPercent ?? 0);
  const peerDeviation = Math.abs(signal.peerDeviationPercent ?? 0);
  const lateUploads7d = signal.lateUploads7d ?? 0;
  const correctionCount7d = signal.correctionCount7d ?? 0;
  const correctionCount30d = signal.correctionCount30d ?? 0;
  const correctionChainLength = signal.correctionChainLength ?? 0;
  const premiumMixSpike =
    (signal.premiumMixPercent ?? 0) - (signal.premiumMixBaselinePercent ?? 0);
  const topBrandDrop = Math.max(0, signal.topBrandDropPercent ?? 0);
  const riskScore7dAverage = signal.riskScore7dAverage ?? 0;
  const unresolvedAnomalyCount = signal.unresolvedAnomalyCount ?? 0;
  const highRiskDaysStreak = signal.highRiskDaysStreak ?? 0;

  if (stockVariance >= thresholds.stockVarianceAmber) {
    const isRed = stockVariance >= thresholds.stockVarianceRed;
    matches.push(
      buildRuleHit(
        "STOCK_MISMATCH",
        severityFromRuleHit(isRed),
        isRed ? 20 : 10,
        `Expected vs reported stock variance is ${stockVariance.toFixed(1)}%.`,
        "Reported closing stock does not reconcile with opening, inward, and sales movement.",
        isRed ? 0.9 : 0.82,
        Math.round((signal.topBrandUnitsBaseline ?? 150) * 0.2)
      )
    );
  }

  if (ownDeviation >= thresholds.ownBaselineAmber) {
    const isRed = ownDeviation >= thresholds.ownBaselineRed;
    matches.push(
      buildRuleHit(
        "OWN_BASELINE_DEVIATION",
        severityFromRuleHit(isRed),
        isRed ? 16 : 8,
        `Outlet deviates ${ownDeviation.toFixed(1)}% from its recent baseline.`,
        "This outlet's current behavior is outside its normal 30-day operating pattern.",
        isRed ? 0.83 : 0.74
      )
    );
  }

  if (peerDeviation >= thresholds.peerDeviationAmber) {
    const isRed = peerDeviation >= thresholds.peerDeviationRed;
    matches.push(
      buildRuleHit(
        "PEER_GROUP_DEVIATION",
        severityFromRuleHit(isRed),
        isRed ? 14 : 7,
        `Outlet is ${peerDeviation.toFixed(1)}% away from peer-group movement.`,
        "Compared to similar outlets in its peer group, this outlet is behaving unusually.",
        isRed ? 0.8 : 0.72
      )
    );
  }

  if (lateUploads7d >= thresholds.lateUploadsAmber) {
    const isRed = lateUploads7d >= thresholds.lateUploadsRed;
    matches.push(
      buildRuleHit(
        "REPEATED_LATE_UPLOADS",
        severityFromRuleHit(isRed),
        isRed ? 12 : 6,
        `${lateUploads7d} late uploads in the last 7 days.`,
        "Repeated delays reduce reporting reliability and can hide operational issues.",
        isRed ? 0.86 : 0.77
      )
    );
  }

  if (signal.missingUploadToday) {
    matches.push(
      buildRuleHit(
        "MISSING_DAILY_UPLOAD",
        "HIGH",
        18,
        "No required daily upload was received for the current date.",
        "Daily oversight is incomplete until the outlet submits today's file.",
        0.95
      )
    );
  }

  if (
    correctionCount7d >= thresholds.correctionCount7dAmber ||
    correctionChainLength >= thresholds.correctionChainRed
  ) {
    const isRed =
      correctionCount7d >= thresholds.correctionCount7dRed ||
      correctionChainLength >= thresholds.correctionChainRed ||
      correctionCount30d >= 10;
    matches.push(
      buildRuleHit(
        "SUSPICIOUS_CORRECTION_PATTERN",
        severityFromRuleHit(isRed),
        isRed ? 16 : 8,
        `Corrections are elevated (${correctionCount7d} in 7d, chain length ${correctionChainLength}).`,
        "Frequent or chained corrections suggest unstable reporting or potential data manipulation.",
        isRed ? 0.84 : 0.75
      )
    );
  }

  if (premiumMixSpike >= thresholds.premiumMixSpikeAmber) {
    const isRed = premiumMixSpike >= thresholds.premiumMixSpikeRed;
    matches.push(
      buildRuleHit(
        "PREMIUM_MIX_SPIKE",
        severityFromRuleHit(isRed),
        isRed ? 12 : 6,
        `Premium share is up by ${premiumMixSpike.toFixed(1)} percentage points.`,
        "Premium brand mix jumped above normal and should be reviewed for channel or discount quality.",
        isRed ? 0.78 : 0.7
      )
    );
  }

  if (topBrandDrop >= thresholds.topBrandDropAmber) {
    const isRed = topBrandDrop >= thresholds.topBrandDropRed;
    matches.push(
      buildRuleHit(
        "TOP_BRAND_SHARP_DROP",
        severityFromRuleHit(isRed),
        isRed ? 14 : 7,
        `Top-selling brands dropped ${topBrandDrop.toFixed(1)}% vs baseline.`,
        "A sharp drop in top brands can indicate stock-out, diversion, or reporting quality problems.",
        isRed ? 0.81 : 0.73,
        Math.round((signal.topBrandUnitsBaseline ?? 120) * (topBrandDrop / 100))
      )
    );
  }

  if (
    riskScore7dAverage >= thresholds.riskAvgAmber ||
    unresolvedAnomalyCount >= thresholds.unresolvedAnomaliesAmber
  ) {
    const isRed =
      riskScore7dAverage >= thresholds.riskAvgRed ||
      unresolvedAnomalyCount >= thresholds.unresolvedAnomaliesRed ||
      highRiskDaysStreak >= 4;
    matches.push(
      buildRuleHit(
        "RISK_ACCUMULATION",
        severityFromRuleHit(isRed),
        isRed ? 18 : 9,
        `Risk remains elevated (7-day avg ${riskScore7dAverage.toFixed(0)}, unresolved ${unresolvedAnomalyCount}).`,
        "Issues are accumulating over multiple days, indicating unresolved control breakdown.",
        isRed ? 0.88 : 0.79
      )
    );
  }

  return matches;
}

export function evaluateOutlet(signal: OutletSignal, options: EngineOptions = {}): OutletAttention {
  const thresholds: RuleThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...options.thresholds
  };
  const baseRiskScore = options.baseRiskScore ?? 10;
  const triggeredRules = evaluateRules(signal, thresholds);
  const totalRuleDelta = triggeredRules.reduce((sum, hit) => sum + hit.riskScoreDelta, 0);
  const riskScore = clampScore(baseRiskScore + totalRuleDelta);
  const reasons = triggeredRules.map((hit) => hit.explanation);
  const managementSummary =
    triggeredRules.length > 0
      ? triggeredRules
          .slice(0, 3)
          .map((hit) => hit.managementExplanation)
          .join(" ")
      : "No material control breakdown detected today for this outlet.";

  return {
    outletId: signal.outletId,
    outletName: signal.outletName,
    city: signal.city,
    state: signal.state,
    riskScore,
    attentionBand: scoreBand(riskScore),
    reasons: reasons.length > 0 ? reasons : ["No material anomalies detected"],
    managementSummary,
    triggeredRules
  };
}

export function buildAnomalyCandidates(
  signal: OutletSignal,
  options: EngineOptions = {}
): AnomalyCandidate[] {
  const thresholds: RuleThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...options.thresholds
  };

  return evaluateRules(signal, thresholds).map((hit) => ({
    outletId: signal.outletId,
    productId: signal.productId ?? null,
    anomalyDate: signal.date,
    ruleCode: hit.ruleCode,
    severity: hit.severity,
    status: hit.status,
    riskScoreDelta: hit.riskScoreDelta,
    summary: hit.explanation,
    details: {
      explanation: hit.explanation,
      managementExplanation: hit.managementExplanation,
      confidenceScore: hit.confidenceScore,
      financialImpactEstimate: hit.financialImpactEstimate
    },
    detectedFromUploadId: signal.uploadId ?? null
  }));
}

export function evaluateAttentionList(
  signals: OutletSignal[],
  options: EngineOptions = {}
): OutletAttention[] {
  return signals.map((signal) => evaluateOutlet(signal, options));
}
