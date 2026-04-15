import { demoOutletSignals } from "@barops/demo-data";
import { evaluateAttentionList } from "@barops/rules-engine";
import { AttentionTable } from "@/components/dashboard/attention-table";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default function DashboardPage(): JSX.Element {
  const attentionRows = evaluateAttentionList(demoOutletSignals).sort(
    (left, right) => right.riskScore - left.riskScore
  );

  const highRiskCount = attentionRows.filter((row) => row.riskScore >= 75).length;
  const mediumRiskCount = attentionRows.filter(
    (row) => row.riskScore >= 45 && row.riskScore < 75
  ).length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Control tower</h1>
        <p className="max-w-3xl text-muted-foreground">
          BarOps Authority sits above POS feeds, Excel imports, and manual uploads. It flags which
          outlet needs central-office action today and explains the why.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Outlets monitored" value={`${attentionRows.length}`} />
        <KpiCard label="High risk outlets" value={`${highRiskCount}`} tone="danger" />
        <KpiCard label="Medium risk outlets" value={`${mediumRiskCount}`} />
      </section>

      <AttentionTable rows={attentionRows} />
    </main>
  );
}
