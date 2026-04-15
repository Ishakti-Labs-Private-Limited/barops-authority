import type { OutletAttention, OutletSignal } from "@barops/shared-types";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function evaluateOutlet(signal: OutletSignal): OutletAttention {
  let score = 10;
  const reasons: string[] = [];

  if (signal.cashVariancePercent > 3) {
    score += signal.cashVariancePercent * 6;
    reasons.push(`Cash variance ${signal.cashVariancePercent.toFixed(1)}%`);
  }

  if (signal.stockVariancePercent > 2) {
    score += signal.stockVariancePercent * 7;
    reasons.push(`Stock variance ${signal.stockVariancePercent.toFixed(1)}%`);
  }

  if (signal.lateOpeningCount7d >= 2) {
    score += signal.lateOpeningCount7d * 5;
    reasons.push(`${signal.lateOpeningCount7d} late openings in 7 days`);
  }

  if (signal.managerOverrideCount7d >= 4) {
    score += signal.managerOverrideCount7d * 4;
    reasons.push(`${signal.managerOverrideCount7d} manager overrides in 7 days`);
  }

  if (reasons.length === 0) {
    reasons.push("No material anomalies detected");
  }

  return {
    outletId: signal.outletId,
    outletName: signal.outletName,
    city: signal.city,
    state: signal.state,
    riskScore: clampScore(score),
    reasons
  };
}

export function evaluateAttentionList(signals: OutletSignal[]): OutletAttention[] {
  return signals.map(evaluateOutlet);
}
