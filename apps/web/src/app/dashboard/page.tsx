import { demoOutletSignals } from "@barops/demo-data";
import { evaluateAttentionList } from "@barops/rules-engine";
import Link from "next/link";
import { AttentionTable, type AttentionBoardRow } from "@/components/dashboard/attention-table";
import { GlossaryTerm } from "@/components/dashboard/glossary-term";
import { LanguageSelector } from "@/components/dashboard/language-selector";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusStrip } from "@/components/dashboard/status-strip";
import { helperText, parseLanguageMode, t, withLang } from "@/lib/demo-i18n";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

function asBoardRowsFromFallback(): AttentionBoardRow[] {
  return evaluateAttentionList(demoOutletSignals).map((row) => ({
    outletId: row.outletId,
    outletName: row.outletName,
    licenseType: "CL7",
    zone: "Central",
    locality: row.city,
    city: row.city,
    state: row.state,
    businessDate: new Date().toISOString().slice(0, 10),
    riskScore: row.riskScore,
    attentionBand: row.riskScore >= 75 ? "RED" : row.riskScore >= 45 ? "AMBER" : "GREEN",
    reasons: row.reasons,
    managementSummary: row.managementSummary,
    anomalyCount: row.triggeredRules.length,
    trendDirection: "STABLE",
    trendDelta: 0,
    closeConfidenceScore: 72,
    missingUploadToday: false,
    lateUploadCount7d: 1,
    postCloseCorrectionCount7d: 0,
    recentUnresolvedIssueCount: row.triggeredRules.length,
    uploadTimelinessStatus: "LATE_TREND",
    lastUploadTime: "N/A",
    complianceNote: "Fallback demo mode active. Live close confidence requires API."
  }));
}

async function getAttentionRows(): Promise<{
  rows: AttentionBoardRow[];
  dataSource: "Live demo" | "Demo mode";
  apiStatus: "Online" | "Unavailable";
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/attention`, {
      next: { revalidate: 30 }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as AttentionBoardRow[];
    return {
      rows: payload.sort((left, right) => right.riskScore - left.riskScore),
      dataSource: "Live demo",
      apiStatus: "Online"
    };
  } catch {
    return {
      rows: asBoardRowsFromFallback().sort((left, right) => right.riskScore - left.riskScore),
      dataSource: "Demo mode",
      apiStatus: "Unavailable"
    };
  }
}

type DashboardPageProps = {
  searchParams?: {
    lang?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps): Promise<JSX.Element> {
  const lang = parseLanguageMode(searchParams?.lang);
  const attentionResult = await getAttentionRows();
  const attentionRows = attentionResult.rows;
  const redCount = attentionRows.filter((row) => row.attentionBand === "RED").length;
  const amberCount = attentionRows.filter((row) => row.attentionBand === "AMBER").length;
  const greenCount = attentionRows.filter((row) => row.attentionBand === "GREEN").length;
  const latestBusinessDate = attentionRows[0]?.businessDate ?? "N/A";

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Control tower</h1>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector />
            <Link
              href={withLang("/dashboard/uploads", lang)}
              className="rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t(lang, "Upload simulation", "ಅಪ್‌ಲೋಡ್ ಅನುಕರಣ")}
            </Link>
            <Link
              href={withLang("/dashboard/executive-summary", lang)}
              className="rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t(lang, "Weekly review summary", "ವಾರವಾರದ ವಿಮರ್ಶಾ ಸಾರಾಂಶ")}
            </Link>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground">
          {t(
            lang,
            "BarOps Authority sits above POS feeds, Excel imports, and manual uploads. It flags which outlet needs central-office action today and explains the why.",
            "BarOps Authority POS, Excel ಮತ್ತು ಮಾನವೀಯ ಅಪ್‌ಲೋಡ್‌ಗಳ ಮೇಲಿನ ನಿಯಂತ್ರಣ ಪದರವಾಗಿದೆ. ಯಾವ ಔಟ್‌ಲೆಟ್‌ಗೆ ಇಂದು ಕೇಂದ್ರ ಕಚೇರಿ ಕ್ರಮ ಬೇಕು ಎಂಬುದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸುತ್ತದೆ."
          )}
        </p>
        {helperText(
          lang,
          "ಕಂಟ್ರೋಲ್ ಟವರ್: ಇಂದು ಗಮನಕ್ಕೆ ಬೇಕಾದ ಔಟ್‌ಲೆಟ್‌, ಕಾರಣ ಮತ್ತು ನಿರ್ವಹಣಾ ಕ್ರಮಗಳನ್ನು ತೋರಿಸುತ್ತದೆ."
        ) ? (
          <p className="text-xs text-muted-foreground">
            {helperText(
              lang,
              "ಕಂಟ್ರೋಲ್ ಟವರ್: ಇಂದು ಗಮನಕ್ಕೆ ಬೇಕಾದ ಔಟ್‌ಲೆಟ್‌, ಕಾರಣ ಮತ್ತು ನಿರ್ವಹಣಾ ಕ್ರಮಗಳನ್ನು ತೋರಿಸುತ್ತದೆ."
            )}
          </p>
        ) : null}
      </header>
      <StatusStrip
        dataSource={attentionResult.dataSource}
        lastRefreshedAt={new Date().toLocaleString()}
        businessDate={latestBusinessDate}
        apiStatus={attentionResult.apiStatus}
      />
      <p className="text-xs text-muted-foreground">
        <GlossaryTerm label="Risk score" help="Composite outlet risk indicator for review prioritization." /> |{" "}
        <GlossaryTerm label="Close confidence" help="Reliability signal for daily close quality and timeliness." /> |{" "}
        <GlossaryTerm label="Anomaly" help="Detected mismatch or unusual signal requiring review." /> |{" "}
        <GlossaryTerm label="Stock variance" help="Difference between expected and reported stock." />
      </p>

      <section className="grid gap-4 md:grid-cols-5">
        <KpiCard label="Outlets monitored" value={`${attentionRows.length}`} />
        <KpiCard label="Red outlets" value={`${redCount}`} tone="danger" />
        <KpiCard label="Amber outlets" value={`${amberCount}`} tone="warning" />
        <KpiCard label="Green outlets" value={`${greenCount}`} tone="success" />
        <KpiCard label="Latest business date" value={latestBusinessDate} />
      </section>

      <AttentionTable rows={attentionRows} lang={lang} />
    </main>
  );
}
