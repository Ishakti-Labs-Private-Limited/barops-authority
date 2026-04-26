import Link from "next/link";
import { LanguageSelector } from "@/components/dashboard/language-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintSummaryButton } from "@/components/dashboard/print-summary-button";
import { StatusStrip } from "@/components/dashboard/status-strip";
import { helperText, parseLanguageMode, t, withLang } from "@/lib/demo-i18n";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type TopRiskOutlet = {
  outletId: string;
  outletName: string;
  zone: string;
  locality: string;
  riskScore: number;
  closeConfidenceScore: number;
};

type ExecutiveSummaryPayload = {
  weekStartDate: string;
  weekEndDate: string;
  redOutlets: number;
  amberOutlets: number;
  greenOutlets: number;
  topRiskOutlets: TopRiskOutlet[];
  outletsRequiringImmediateVisit: TopRiskOutlet[];
  managementRecommendations: string[];
};

type ExceptionSummaryPayload = {
  repeatedUnresolvedOutlets: Array<{
    outletName: string;
    repeatedIssueCount: number;
    unresolvedIssueCount: number;
  }>;
};

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
      throw new Error("Unable to load executive summary.");
    }
    return {
      payload: (await response.json()) as ExecutiveSummaryPayload,
      dataSource: "Live demo",
      apiStatus: "Online"
    };
  } catch {
    return {
      payload: {
        weekStartDate: "N/A",
        weekEndDate: "N/A",
        redOutlets: 0,
        amberOutlets: 0,
        greenOutlets: 0,
        topRiskOutlets: [],
        outletsRequiringImmediateVisit: [],
        managementRecommendations: ["Owner briefing data is temporarily unavailable."]
      },
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
      return { repeatedUnresolvedOutlets: [] };
    }
    return (await response.json()) as ExceptionSummaryPayload;
  } catch {
    return { repeatedUnresolvedOutlets: [] };
  }
}

type OwnerBriefingPageProps = {
  searchParams?: {
    lang?: string;
  };
};

export default async function OwnerBriefingPage({ searchParams }: OwnerBriefingPageProps): Promise<JSX.Element> {
  const lang = parseLanguageMode(searchParams?.lang);
  const [summaryResult, exceptionSummary] = await Promise.all([getExecutiveSummary(), getExceptionSummary()]);
  const summary = summaryResult.payload;

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-4 bg-background px-4 py-6 print:max-w-none print:bg-white print:px-2 print:py-3">
      <header className="space-y-2 border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex gap-2">
            <LanguageSelector />
            <PrintSummaryButton />
            <Link
              href={withLang("/dashboard/executive-summary", lang)}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t(lang, "Back to weekly summary", "ವಾರವಾರದ ಸಾರಾಂಶಕ್ಕೆ ಹಿಂತಿರುಗಿ")}
            </Link>
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t(lang, "Owner briefing pack", "ಒನರ್ ಬ್ರಿಫಿಂಗ್ ಪ್ಯಾಕ್")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(lang, "BarOps weekly control brief", "BarOps ವಾರವಾರದ ನಿಯಂತ್ರಣ ಸಂಕ್ಷಿಪ್ತ ವರದಿ")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(lang, "Reporting period:", "ವರದಿ ಅವಧಿ:")} {summary.weekStartDate} {t(lang, "to", "ರಿಂದ")}{" "}
          {summary.weekEndDate}
        </p>
        {helperText(lang, "60 ಸೆಕೆಂಡ್ ಒನರ್ ವಿಮರ್ಶೆಗಾಗಿ ಸಂಕ್ಷಿಪ್ತ ನಿಯಂತ್ರಣ ಬ್ರಿಫಿಂಗ್.") ? (
          <p className="text-xs text-muted-foreground">
            {helperText(lang, "60 ಸೆಕೆಂಡ್ ಒನರ್ ವಿಮರ್ಶೆಗಾಗಿ ಸಂಕ್ಷಿಪ್ತ ನಿಯಂತ್ರಣ ಬ್ರಿಫಿಂಗ್.")}
          </p>
        ) : null}
      </header>
      <StatusStrip
        dataSource={summaryResult.dataSource}
        lastRefreshedAt={new Date().toLocaleString()}
        businessDate={summary.weekEndDate}
        apiStatus={summaryResult.apiStatus}
      />

      <section className="grid gap-3 sm:grid-cols-3">
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

      <section className="grid gap-3 md:grid-cols-2">
        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Top 3 risky outlets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.topRiskOutlets.slice(0, 3).map((outlet) => (
              <div key={outlet.outletId} className="rounded-md border px-3 py-2">
                <p className="font-medium">{outlet.outletName}</p>
                <p className="text-xs text-muted-foreground">
                  {outlet.zone} - {outlet.locality} | Risk {outlet.riskScore} | Close confidence{" "}
                  {outlet.closeConfidenceScore}/100
                </p>
              </div>
            ))}
            {summary.topRiskOutlets.length === 0 ? (
              <p className="rounded-md border px-3 py-2 text-muted-foreground">
                Top-risk outlet data is not available right now.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle>Outlets requiring immediate visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.outletsRequiringImmediateVisit.slice(0, 3).map((outlet) => (
              <div key={outlet.outletId} className="rounded-md border px-3 py-2">
                <p className="font-medium">{outlet.outletName}</p>
                <p className="text-xs text-muted-foreground">
                  {outlet.zone} - {outlet.locality}
                </p>
              </div>
            ))}
            {summary.outletsRequiringImmediateVisit.length === 0 ? (
              <p className="rounded-md border px-3 py-2 text-muted-foreground">
                No immediate-visit outlets are currently flagged.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="print:break-inside-avoid print:shadow-none">
        <CardHeader>
          <CardTitle>Repeated unresolved issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {exceptionSummary.repeatedUnresolvedOutlets.slice(0, 3).map((item) => (
            <div key={item.outletName} className="rounded-md border px-3 py-2">
              <p className="font-medium">{item.outletName}</p>
              <p className="text-xs text-muted-foreground">
                Repeated unresolved: {item.repeatedIssueCount} | Open backlog: {item.unresolvedIssueCount}
              </p>
            </div>
          ))}
          {exceptionSummary.repeatedUnresolvedOutlets.length === 0 ? (
            <p className="rounded-md border px-3 py-2 text-muted-foreground">
              No repeated unresolved issue pattern flagged this week.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid print:shadow-none">
        <CardHeader>
          <CardTitle>Management recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {summary.managementRecommendations.slice(0, 4).map((recommendation, index) => (
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
