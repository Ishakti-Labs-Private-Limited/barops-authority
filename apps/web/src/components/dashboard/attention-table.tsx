"use client";

import { Fragment, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
};

type AttentionTableProps = {
  rows: AttentionBoardRow[];
};

export function AttentionTable({ rows }: AttentionTableProps): JSX.Element {
  const [bandFilter, setBandFilter] = useState<"ALL" | "RED" | "AMBER" | "GREEN">("ALL");
  const [licenseFilter, setLicenseFilter] = useState<"ALL" | string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<"ALL" | string>("ALL");
  const [expandedOutletId, setExpandedOutletId] = useState<string | null>(null);

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
        return true;
      }),
    [rows, bandFilter, licenseFilter, zoneFilter]
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
        <CardTitle>Outlets requiring attention today</CardTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Attention band</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={bandFilter}
              onChange={(event) =>
                setBandFilter(event.target.value as "ALL" | "RED" | "AMBER" | "GREEN")
              }
            >
              <option value="ALL">All bands</option>
              <option value="RED">Red</option>
              <option value="AMBER">Amber</option>
              <option value="GREEN">Green</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">License type</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={licenseFilter}
              onChange={(event) => setLicenseFilter(event.target.value)}
            >
              <option value="ALL">All license types</option>
              {licenseTypes.map((licenseType) => (
                <option key={licenseType} value={licenseType}>
                  {licenseType}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Zone</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
            >
              <option value="ALL">All zones</option>
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
              <TableHead>Outlet</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Zone / locality</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Anomalies</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Top reasons</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <Fragment key={row.outletId}>
                <TableRow>
                  <TableCell className="font-medium">{row.outletName}</TableCell>
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
                  <TableCell>{row.reasons.slice(0, 2).join(", ")}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                      onClick={() =>
                        setExpandedOutletId((prev) => (prev === row.outletId ? null : row.outletId))
                      }
                    >
                      {expandedOutletId === row.outletId ? "Hide" : "View"}
                    </button>
                  </TableCell>
                </TableRow>
                <TableRow className={expandedOutletId === row.outletId ? "" : "hidden"}>
                  <TableCell colSpan={9} className="bg-muted/30 text-sm">
                    <p className="mb-2 font-medium">Management summary</p>
                    <p className="mb-2 text-muted-foreground">{row.managementSummary}</p>
                    <p className="text-xs text-muted-foreground">
                      Business date: {row.businessDate} - {row.city}, {row.state}
                    </p>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
