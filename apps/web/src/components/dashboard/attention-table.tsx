"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type LanguageMode, t, withLang } from "@/lib/demo-i18n";

export type AttentionBoardRow = {
  outletId: string;
  outletName: string;
  licenseType: string;
  zone: string;
  locality: string;
  city: string;
  state: string;
  businessDate: string;
  riskScore: number;
  attentionBand: "GREEN" | "AMBER" | "RED";
  reasons: string[];
  managementSummary: string;
  anomalyCount: number;
  trendDirection: "UP" | "DOWN" | "STABLE";
  trendDelta: number;
  closeConfidenceScore: number;
  missingUploadToday: boolean;
  lateUploadCount7d: number;
  postCloseCorrectionCount7d: number;
  recentUnresolvedIssueCount: number;
  uploadTimelinessStatus: "ON_TIME" | "LATE_TREND" | "CHRONIC_LATE" | "MISSING_UPLOAD";
  lastUploadTime: string;
  complianceNote: string;
};

type AttentionTableProps = {
  rows: AttentionBoardRow[];
  lang: LanguageMode;
};

export function AttentionTable({ rows, lang }: AttentionTableProps): JSX.Element {
  const [bandFilter, setBandFilter] = useState<"ALL" | "RED" | "AMBER" | "GREEN">("ALL");
  const [licenseFilter, setLicenseFilter] = useState<"ALL" | string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<"ALL" | string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const licenseTypes = useMemo(
    () => Array.from(new Set(rows.map((row) => row.licenseType))).sort(),
    [rows]
  );
  const zones = useMemo(() => Array.from(new Set(rows.map((row) => row.zone))).sort(), [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (bandFilter !== "ALL" && row.attentionBand !== bandFilter) {
          return false;
        }
        if (licenseFilter !== "ALL" && row.licenseType !== licenseFilter) {
          return false;
        }
        if (zoneFilter !== "ALL" && row.zone !== zoneFilter) {
          return false;
        }
        if (
          searchTerm.trim().length > 0 &&
          !row.outletName.toLowerCase().includes(searchTerm.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [rows, bandFilter, licenseFilter, zoneFilter, searchTerm]
  );

  const bandBadgeClass = (band: AttentionBoardRow["attentionBand"]): string => {
    if (band === "RED") {
      return "bg-danger text-danger-foreground border-transparent";
    }
    if (band === "AMBER") {
      return "bg-amber-100 text-amber-700 border-amber-300";
    }
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  };

  const trendLabel = (row: AttentionBoardRow): string => {
    if (row.trendDirection === "UP") {
      return `UP +${Math.abs(row.trendDelta)}`;
    }
    if (row.trendDirection === "DOWN") {
      return `DOWN -${Math.abs(row.trendDelta)}`;
    }
    return "STABLE 0";
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>{t(lang, "Outlets requiring attention today", "ಇಂದು ಗಮನಕ್ಕೆ ಬೇಕಾದ ಔಟ್‌ಲೆಟ್‌ಗಳು")}</CardTitle>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Outlet search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search outlet name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Search outlet name"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t(lang, "Attention band", "ಗಮನ ಬ್ಯಾಂಡ್")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={bandFilter}
              onChange={(event) =>
                setBandFilter(event.target.value as "ALL" | "RED" | "AMBER" | "GREEN")
              }
            >
              <option value="ALL">{t(lang, "All bands", "ಎಲ್ಲ ಬ್ಯಾಂಡ್‌ಗಳು")}</option>
              <option value="RED">{t(lang, "Red", "ಕೆಂಪು")}</option>
              <option value="AMBER">{t(lang, "Amber", "ಅಂಬರ್")}</option>
              <option value="GREEN">{t(lang, "Green", "ಹಸಿರು")}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t(lang, "License type", "ಲೈಸೆನ್ಸ್ ಪ್ರಕಾರ")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={licenseFilter}
              onChange={(event) => setLicenseFilter(event.target.value)}
            >
              <option value="ALL">{t(lang, "All license types", "ಎಲ್ಲ ಲೈಸೆನ್ಸ್ ಪ್ರಕಾರಗಳು")}</option>
              {licenseTypes.map((licenseType) => (
                <option key={licenseType} value={licenseType}>
                  {licenseType}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t(lang, "Zone", "ವಲಯ")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
            >
              <option value="ALL">{t(lang, "All zones", "ಎಲ್ಲ ವಲಯಗಳು")}</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, "Outlet", "ಔಟ್‌ಲೆಟ್")}</TableHead>
              <TableHead>{t(lang, "License", "ಲೈಸೆನ್ಸ್")}</TableHead>
              <TableHead>{t(lang, "Zone / locality", "ವಲಯ / ಪ್ರದೇಶ")}</TableHead>
              <TableHead>{t(lang, "Band", "ಬ್ಯಾಂಡ್")}</TableHead>
              <TableHead>{t(lang, "Risk", "ರಿಸ್ಕ್")}</TableHead>
              <TableHead>{t(lang, "Anomalies", "ಅಸಾಮಾನ್ಯತೆಗಳು")}</TableHead>
              <TableHead>{t(lang, "Trend", "ಪ್ರವೃತ್ತಿ")}</TableHead>
              <TableHead>{t(lang, "Close confidence", "ಕ್ಲೋಸ್ ವಿಶ್ವಾಸ")}</TableHead>
              <TableHead>{t(lang, "Top reasons", "ಮುಖ್ಯ ಕಾರಣಗಳು")}</TableHead>
              <TableHead className="text-right">{t(lang, "Detail", "ವಿವರ")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <Fragment key={row.outletId}>
                <TableRow>
                  <TableCell className="font-medium">
                    <Link
                      href={withLang(`/dashboard/outlets/${row.outletId}`, lang)}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {row.outletName}
                    </Link>
                  </TableCell>
                  <TableCell>{row.licenseType}</TableCell>
                  <TableCell>{`${row.zone} / ${row.locality}`}</TableCell>
                  <TableCell>
                    <Badge className={bandBadgeClass(row.attentionBand)}>{row.attentionBand}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.riskScore >= 75 ? "destructive" : "secondary"}
                      className="min-w-12 justify-center"
                    >
                      {row.riskScore}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.anomalyCount}</TableCell>
                  <TableCell>{trendLabel(row)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={row.closeConfidenceScore < 55 ? "destructive" : "secondary"}
                        className="min-w-20 justify-center"
                      >
                        {`Close ${row.closeConfidenceScore}/100`}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground">
                        {row.missingUploadToday
                          ? "Missing upload"
                          : row.postCloseCorrectionCount7d > 0
                            ? "Post-close corrections"
                            : row.lateUploadCount7d > 0
                              ? "Late upload trend"
                              : "On-time close"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{row.reasons.slice(0, 2).join(", ")}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={withLang(`/dashboard/outlets/${row.outletId}`, lang)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                    >
                      {t(lang, "Open", "ತೆರೆ")}
                    </Link>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No outlets match current search and filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
