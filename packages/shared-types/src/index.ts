export type SignalSource = "POS" | "EXCEL" | "MANUAL_UPLOAD";

export type OutletSignal = {
  outletId: string;
  outletCode: string;
  outletName: string;
  city: string;
  state: string;
  source: SignalSource;
  date: string;
  cashVariancePercent: number;
  lateOpeningCount7d: number;
  stockVariancePercent: number;
  managerOverrideCount7d: number;
};

export type OutletAttention = {
  outletId: string;
  outletName: string;
  city: string;
  state: string;
  riskScore: number;
  reasons: string[];
};
