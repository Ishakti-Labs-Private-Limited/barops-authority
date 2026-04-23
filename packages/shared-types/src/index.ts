export type SignalSource = "POS" | "EXCEL" | "MANUAL_UPLOAD";
export type OutletLicenseType = "CL2" | "CL7" | "CL9";
export type UserRole = "HQ_ADMIN" | "REGIONAL_MANAGER" | "AUDITOR" | "DEMO_VIEWER";
export type UploadType = "DAILY_SALES" | "DAILY_STOCK" | "MANUAL_CORRECTION";
export type UploadStatus = "RECEIVED" | "PROCESSED" | "FAILED" | "CORRECTED";
export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "FALSE_POSITIVE";

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
