import Link from "next/link";
import { PrintSummaryButton } from "@/components/dashboard/print-summary-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type TopRiskOutlet = {
  outletId: string;
  outletName: string;
  zone: string;
  locality: string;
  riskScore: number;
  anomalyCount: number;
  reasons: string[];
};

type IssuePattern = {
  issue: string;
  affectedOutlets: number;
};

type ZoneRiskSummary = {
  zone: string;
  outlets: number;
  avgRiskScore: number;
  redOutlets: number;
  amberOutlets: number;
  greenOutlets: number;
};

type ExecutiveSummaryPayload = {
  weekStartDate: string;
  weekEndDate: string;
  totalOutletsMonitored: number;
  redOutlets: number;
  amberOutlets: number;
  greenOutlets: number;
  topRiskOutlets: TopRiskOutlet[];
  repeatedIssuePatterns: IssuePattern[];
  zoneRiskSummary: ZoneRiskSummary[];
  outletsRequiringImmediateVisit: TopRiskOutlet[];
  managementRecommendations: string[];
};

function fallbackExecutiveSummary(): ExecutiveSummaryPayload {
  return {
    weekStartDate: "N/A",
    weekEndDate: "N/A",
    totalOutletsMonitored: 0,
    redOutlets: 0,
    amberOutlets: 0,
    greenOutlets: 0,
    topRiskOutlets: [],
    repeatedIssuePatterns: [],
    zoneRiskSummary: [],
    outletsRequiringImmediateVisit: [],
    managementRecommendations: [
      "Weekly executive summary is temporarily unavailable. Verify API service health and try again."
    ]
  };
}

async function getExecutiveSummary(): Promise<ExecutiveSummaryPayload> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/executive-summary/weekly`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return (await response.json()) as ExecutiveSummaryPayload;
  } catch {
    return fallbackExecutiveSummary();
  }
}

function bandForScore(score: number): "RED" | "AMBER" | "GREEN" {
  if (score >= 75) {
    return "RED";
  }
  if (score >= 45) {
    return "AMBER";
  }
  return "GREEN";
}

function bandBadgeClass(band: "RED" | "AMBER" | "GREEN"): string {
  if (band === "RED") {
    return "bg-danger text-danger-foreground border-transparent";
  }
  if (band === "AMBER") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-300";
}

export default async function ExecutiveSummaryPage(): Promise<JSX.Element> {
  const summary = await getExecutiveSummary();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 bg-background px-6 py-10 print:max-w-none print:bg-white print:px-2 print:py-4">
      <header className="space-y-3 border-b pb-4 print:space-y-2 print:pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 print:block">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              BarOps Authority
            </p>
            <h1 className="text-3xl font-semibold tracking-tight print:text-2xl">Executive Weekly Summary</h1>
            <p className="text-sm text-muted-foreground">
              Reporting period: {summary.weekStartDate} to {summary.weekEndDate}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <PrintSummaryButton />
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4 print:grid-cols-4 print:gap-2">
        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Total outlets monitored</CardDescription>
            <CardTitle className="text-2xl">{summary.totalOutletsMonitored}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Red outlets</CardDescription>
            <CardTitle className="text-2xl text-danger">{summary.redOutlets}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Amber outlets</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{summary.amberOutlets}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Green outlets</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{summary.greenOutlets}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 print:gap-2">
        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Top risky outlets this week</CardTitle>
            <CardDescription>Highest-risk outlets requiring close management oversight.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Anomalies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topRiskOutlets.map((outlet) => {
                  const band = bandForScore(outlet.riskScore);
                  return (
                    <TableRow key={outlet.outletId}>
                      <TableCell>
                        <p className="font-medium">{outlet.outletName}</p>
                        <p className="text-xs text-muted-foreground">{outlet.locality}</p>
                      </TableCell>
                      <TableCell>{outlet.zone}</TableCell>
                      <TableCell>
                        <Badge className={bandBadgeClass(band)}>{outlet.riskScore}</Badge>
                      </TableCell>
                      <TableCell>{outlet.anomalyCount}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Repeated issue patterns</CardTitle>
            <CardDescription>Signals recurring across multiple outlets.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {summary.repeatedIssuePatterns.map((pattern) => (
                <li key={pattern.issue} className="rounded-md border px-3 py-2">
                  <p className="font-medium">{pattern.issue}</p>
                  <p className="text-xs text-muted-foreground">{pattern.affectedOutlets} outlet(s) affected</p>
                </li>
              ))}
              {summary.repeatedIssuePatterns.length === 0 ? (
                <li className="rounded-md border px-3 py-2 text-muted-foreground">
                  No repeated issue pattern data is currently available.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 print:gap-2">
        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Zone-wise risk summary</CardTitle>
            <CardDescription>Comparative risk posture by operating zone.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Outlets</TableHead>
                  <TableHead>Avg risk</TableHead>
                  <TableHead>R/A/G</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.zoneRiskSummary.map((zone) => (
                  <TableRow key={zone.zone}>
                    <TableCell className="font-medium">{zone.zone}</TableCell>
                    <TableCell>{zone.outlets}</TableCell>
                    <TableCell>{zone.avgRiskScore}</TableCell>
                    <TableCell>{`${zone.redOutlets}/${zone.amberOutlets}/${zone.greenOutlets}`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Outlets requiring immediate visit</CardTitle>
            <CardDescription>Field-priority outlets for the current review window.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {summary.outletsRequiringImmediateVisit.map((outlet) => (
                <li key={outlet.outletId} className="rounded-md border px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{outlet.outletName}</p>
                      <p className="text-xs text-muted-foreground">{`${outlet.zone} - ${outlet.locality}`}</p>
                    </div>
                    <Badge className={bandBadgeClass(bandForScore(outlet.riskScore))}>{outlet.riskScore}</Badge>
                  </div>
                </li>
              ))}
              {summary.outletsRequiringImmediateVisit.length === 0 ? (
                <li className="rounded-md border px-3 py-2 text-muted-foreground">
                  No immediate-visit outlets are currently flagged.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card className="print:break-inside-avoid print:shadow-none">
        <CardHeader>
          <CardTitle>Management recommendations</CardTitle>
          <CardDescription>Concise actions for weekly central-office review.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {summary.managementRecommendations.map((recommendation, index) => (
              <li key={recommendation} className="rounded-md border px-3 py-2">
                <span className="mr-2 font-semibold text-muted-foreground">{index + 1}.</span>
                {recommendation}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </main>
  );
}
