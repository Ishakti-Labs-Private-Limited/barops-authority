import { demoOutletSignals } from "@barops/demo-data";
import { evaluateAttentionList } from "@barops/rules-engine";
import Link from "next/link";
import { AttentionTable, type AttentionBoardRow } from "@/components/dashboard/attention-table";
import { KpiCard } from "@/components/dashboard/kpi-card";

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
    trendDelta: 0
  }));
}

async function getAttentionRows(): Promise<AttentionBoardRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/attention`, {
      next: { revalidate: 30 }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as AttentionBoardRow[];
    return payload.sort((left, right) => right.riskScore - left.riskScore);
  } catch {
    return asBoardRowsFromFallback().sort((left, right) => right.riskScore - left.riskScore);
  }
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const attentionRows = await getAttentionRows();
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
            <Link
              href="/dashboard/uploads"
              className="rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              Upload simulation
            </Link>
            <Link
              href="/dashboard/executive-summary"
              className="rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              Open executive summary
            </Link>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground">
          BarOps Authority sits above POS feeds, Excel imports, and manual uploads. It flags which
          outlet needs central-office action today and explains the why.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        <KpiCard label="Outlets monitored" value={`${attentionRows.length}`} />
        <KpiCard label="Red outlets" value={`${redCount}`} tone="danger" />
        <KpiCard label="Amber outlets" value={`${amberCount}`} tone="warning" />
        <KpiCard label="Green outlets" value={`${greenCount}`} tone="success" />
        <KpiCard label="Latest business date" value={latestBusinessDate} />
      </section>

      <AttentionTable rows={attentionRows} />
    </main>
  );
}
