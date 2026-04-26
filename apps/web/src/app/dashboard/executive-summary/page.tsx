import Link from "next/link";
import { LanguageSelector } from "@/components/dashboard/language-selector";
import { PrintSummaryButton } from "@/components/dashboard/print-summary-button";
import { StatusStrip } from "@/components/dashboard/status-strip";
import { GlossaryTerm } from "@/components/dashboard/glossary-term";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { helperText, parseLanguageMode, t, withLang } from "@/lib/demo-i18n";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type TopRiskOutlet = {
  outletId: string;
  outletName: string;
  zone: string;
  locality: string;
  riskScore: number;
  anomalyCount: number;
  closeConfidenceScore: number;
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
  lowConfidenceOutlets: number;
  lowConfidenceOutletList: TopRiskOutlet[];
  repeatedLateOrMissingPatterns: number;
  managementRecommendations: string[];
};

type ExceptionSummaryPayload = {
  overdueOpenIssues: number;
  closureSlaAtRisk: number;
  repeatedUnresolvedOutlets: Array<{
    outletName: string;
    repeatedIssueCount: number;
    unresolvedIssueCount: number;
  }>;
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
    lowConfidenceOutlets: 0,
    lowConfidenceOutletList: [],
    repeatedLateOrMissingPatterns: 0,
    managementRecommendations: [
      "Weekly executive summary is temporarily unavailable. Verify API service health and try again."
    ]
  };
}

async function getExecutiveSummary(): Promise<{
  payload: ExecutiveSummaryPayload;
  dataSource: "Live demo" | "Demo mode";
  apiStatus: "Online" | "Unavailable";
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/executive-summary/weekly`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return {
      payload: (await response.json()) as ExecutiveSummaryPayload,
      dataSource: "Live demo",
      apiStatus: "Online"
    };
  } catch {
    return {
      payload: fallbackExecutiveSummary(),
      dataSource: "Demo mode",
      apiStatus: "Unavailable"
    };
  }
}

async function getExceptionSummary(): Promise<ExceptionSummaryPayload> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/exceptions/summary`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return (await response.json()) as ExceptionSummaryPayload;
  } catch {
    return {
      overdueOpenIssues: 0,
      closureSlaAtRisk: 0,
      repeatedUnresolvedOutlets: []
    };
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

type ExecutiveSummaryPageProps = {
  searchParams?: {
    lang?: string;
  };
};

export default async function ExecutiveSummaryPage({ searchParams }: ExecutiveSummaryPageProps): Promise<JSX.Element> {
  const lang = parseLanguageMode(searchParams?.lang);
  const executiveResult = await getExecutiveSummary();
  const summary = executiveResult.payload;
  const exceptionSummary = await getExceptionSummary();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 bg-background px-6 py-10 print:max-w-none print:bg-white print:px-2 print:py-4">
      <header className="space-y-3 border-b pb-4 print:space-y-2 print:pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 print:block">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              BarOps Authority
            </p>
            <h1 className="text-3xl font-semibold tracking-tight print:text-2xl">
              {t(lang, "Executive Weekly Summary", "ಕಾರ್ಯನಿರ್ವಾಹಕ ವಾರವಾರದ ಸಾರಾಂಶ")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(lang, "Reporting period:", "ವರದಿ ಅವಧಿ:")} {summary.weekStartDate} {t(lang, "to", "ರಿಂದ")}{" "}
              {summary.weekEndDate}
            </p>
            {helperText(lang, "ವಾರವಾರದ ಕಾರ್ಯನಿರ್ವಾಹಕ ವಿಮರ್ಶೆಗಾಗಿ ಸಂಕ್ಷಿಪ್ತ ನಿರ್ವಹಣಾ ನಿಯಂತ್ರಣ ವರದಿ.") ? (
              <p className="text-xs text-muted-foreground">
                {helperText(lang, "ವಾರವಾರದ ಕಾರ್ಯನಿರ್ವಾಹಕ ವಿಮರ್ಶೆಗಾಗಿ ಸಂಕ್ಷಿಪ್ತ ನಿರ್ವಹಣಾ ನಿಯಂತ್ರಣ ವರದಿ.")}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <LanguageSelector />
            <PrintSummaryButton />
            <Link
              href={withLang("/dashboard/owner-briefing", lang)}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t(lang, "Generate owner briefing", "ಒನರ್ ಬ್ರಿಫಿಂಗ್ ರಚಿಸಿ")}
            </Link>
            <Link
              href={withLang("/dashboard", lang)}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t(lang, "Back to dashboard", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ")}
            </Link>
          </div>
        </div>
      </header>
      <StatusStrip
        dataSource={executiveResult.dataSource}
        lastRefreshedAt={new Date().toLocaleString()}
        businessDate={summary.weekEndDate}
        apiStatus={executiveResult.apiStatus}
      />
      <p className="text-xs text-muted-foreground">
        <GlossaryTerm label="Weekly review summary" help="Management snapshot of weekly risk and closure discipline." />{" "}
        | <GlossaryTerm label="SLA at risk" help="Open issue due within 24 hours and not yet closed." />
      </p>

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
            <CardTitle>Review quality and close confidence</CardTitle>
            <CardDescription>Signals reliability of weekly close and timeliness discipline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Low-confidence outlets this week:{" "}
              <span className="font-semibold text-danger">{summary.lowConfidenceOutlets}</span>
            </p>
            <p>
              Repeated late-close / missing-upload patterns:{" "}
              <span className="font-semibold">{summary.repeatedLateOrMissingPatterns}</span>
            </p>
            <ul className="space-y-2">
              {summary.lowConfidenceOutletList.slice(0, 3).map((outlet) => (
                <li key={outlet.outletId} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{outlet.outletName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Close confidence {outlet.closeConfidenceScore}/100
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

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
                {summary.topRiskOutlets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No outlet risk rows are available for this period.
                    </TableCell>
                  </TableRow>
                ) : null}
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

      <section className="grid gap-4 md:grid-cols-3 print:gap-2">
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
            <CardTitle>Closure SLA at risk</CardTitle>
            <CardDescription>Open issues due within 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-amber-600">
              {exceptionSummary.closureSlaAtRisk}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              These issues need proactive follow-up before they become overdue.
            </p>
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

      <section className="grid gap-4 md:grid-cols-2 print:gap-2">
        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Overdue open issues</CardTitle>
            <CardDescription>Exceptions that have crossed target closure date.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-danger">{exceptionSummary.overdueOpenIssues}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              These items should be escalated in today&apos;s management review.
            </p>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Repeated unresolved issues</CardTitle>
            <CardDescription>Outlets where unresolved issues are recurring repeatedly.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {exceptionSummary.repeatedUnresolvedOutlets.map((item) => (
                <li key={item.outletName} className="rounded-md border px-3 py-2">
                  <p className="font-medium">{item.outletName}</p>
                  <p className="text-xs text-muted-foreground">
                    Repeated: {item.repeatedIssueCount} | Unresolved total: {item.unresolvedIssueCount}
                  </p>
                </li>
              ))}
              {exceptionSummary.repeatedUnresolvedOutlets.length === 0 ? (
                <li className="rounded-md border px-3 py-2 text-muted-foreground">
                  No repeated unresolved patterns are currently flagged.
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
