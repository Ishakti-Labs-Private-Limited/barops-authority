export type SignalSource = "POS" | "EXCEL" | "MANUAL_UPLOAD";
export type OutletLicenseType = "CL2" | "CL7" | "CL9";
export type UserRole = "HQ_ADMIN" | "REGIONAL_MANAGER" | "AUDITOR" | "DEMO_VIEWER";
export type UploadType = "DAILY_SALES" | "DAILY_STOCK" | "MANUAL_CORRECTION";
export type UploadStatus = "RECEIVED" | "PROCESSED" | "FAILED" | "CORRECTED";
export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "FALSE_POSITIVE";
export type RuleCode =
  | "STOCK_MISMATCH"
  | "OWN_BASELINE_DEVIATION"
  | "PEER_GROUP_DEVIATION"
  | "REPEATED_LATE_UPLOADS"
  | "MISSING_DAILY_UPLOAD"
  | "SUSPICIOUS_CORRECTION_PATTERN"
  | "PREMIUM_MIX_SPIKE"
  | "TOP_BRAND_SHARP_DROP"
  | "RISK_ACCUMULATION";

export type OutletSignal = {
  outletId: string;
  outletCode: string;
  outletName: string;
  city: string;
  state: string;
  source: SignalSource;
  date: string;
  uploadId?: string | null;
  peerGroupId?: string | null;
  productId?: string | null;
  stockVariancePercent?: number;
  ownBaselineDeviationPercent?: number;
  peerDeviationPercent?: number;
  lateUploads7d?: number;
  missingUploadToday?: boolean;
  correctionCount7d?: number;
  correctionCount30d?: number;
  correctionChainLength?: number;
  premiumMixPercent?: number;
  premiumMixBaselinePercent?: number;
  topBrandDropPercent?: number;
  topBrandUnitsToday?: number;
  topBrandUnitsBaseline?: number;
  riskScore7dAverage?: number;
  unresolvedAnomalyCount?: number;
  highRiskDaysStreak?: number;
};

export type RuleEvaluation = {
  ruleCode: RuleCode;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  riskScoreDelta: number;
  explanation: string;
  managementExplanation: string;
  financialImpactEstimate: number | null;
  confidenceScore: number;
};

export type AnomalyCandidate = {
  outletId: string;
  productId: string | null;
  anomalyDate: string;
  ruleCode: RuleCode;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  riskScoreDelta: number;
  summary: string;
  details: Record<string, unknown>;
  detectedFromUploadId: string | null;
};

export type OutletAttention = {
  outletId: string;
  outletName: string;
  city: string;
  state: string;
  riskScore: number;
  attentionBand: "GREEN" | "AMBER" | "RED";
  reasons: string[];
  managementSummary: string;
  triggeredRules: RuleEvaluation[];
};

export type Outlet = {
  id: string;
  outletCode: string;
  outletName: string;
  licenseType: OutletLicenseType;
  city: string;
  state: string;
  zone: string;
  locality: string;
  peerGroupId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyStock = {
  id: string;
  outletId: string;
  productId: string;
  stockDate: string;
  openingUnits: number;
  inwardUnits: number;
  soldUnits: number;
  expectedClosingUnits: number;
  actualClosingUnits: number;
  varianceUnits: number;
  variancePercent: number;
  uploadId: string | null;
};

export type Upload = {
  id: string;
  outletId: string | null;
  uploadType: UploadType;
  source: SignalSource;
  uploadDate: string;
  status: UploadStatus;
  fileName: string | null;
  checksumSha256: string | null;
  uploadedByUserId: string | null;
  recordsCount: number;
  errorCount: number;
  supersedesUploadId: string | null;
  correctionNote: string | null;
  createdAt: string;
  updatedAt: string;
};
