import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RequiredActionsPanel } from "@/components/dashboard/required-actions-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionBoardRow } from "@/components/dashboard/attention-table";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type OutletDetailPageProps = {
  params: {
    outletId: string;
  };
};

function unavailableRow(outletId: string, reason: string): AttentionBoardRow {
  return {
    outletId,
    outletName: "Outlet detail unavailable",
    licenseType: "N/A",
    zone: "N/A",
    locality: "N/A",
    city: "Bengaluru",
    state: "Karnataka",
    businessDate: new Date().toISOString().slice(0, 10),
    riskScore: 0,
    attentionBand: "GREEN",
    reasons: [reason],
    managementSummary: "Live outlet detail could not be loaded for this outlet.",
    anomalyCount: 0,
    trendDirection: "STABLE",
    trendDelta: 0
  };
}

async function getOutletDetail(outletId: string): Promise<AttentionBoardRow | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/attention/${outletId}`, {
      next: { revalidate: 30 }
    });
    if (!response.ok) {
      return unavailableRow(
        outletId,
        response.status === 404
          ? "Outlet was not found in API response."
          : `API request failed while loading outlet detail (status ${response.status}).`
      );
    }
    const payload = (await response.json()) as AttentionBoardRow | { data?: AttentionBoardRow };
    const row = "data" in payload && payload.data ? payload.data : payload;
    return row;
  } catch {
    return unavailableRow(
      outletId,
      "Live API is currently unavailable. Start backend API to load full outlet detail."
    );
  }
}

function attentionBadgeClass(attentionBand: AttentionBoardRow["attentionBand"]): string {
  if (attentionBand === "RED") {
    return "bg-danger text-danger-foreground border-transparent";
  }
  if (attentionBand === "AMBER") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-300";
}

function trendCopy(row: AttentionBoardRow): string {
  if (row.trendDirection === "UP") {
    return `Risk trend is rising by ${Math.abs(row.trendDelta)} points versus recent period.`;
  }
  if (row.trendDirection === "DOWN") {
    return `Risk trend is improving by ${Math.abs(row.trendDelta)} points versus recent period.`;
  }
  return "Risk trend is stable versus recent period.";
}

function dataQualityCopy(row: AttentionBoardRow): string {
  const missingUploadReason = row.reasons.find((reason) => reason.toLowerCase().includes("upload"));
  if (missingUploadReason) {
    return "Upload completeness is a concern today. Management should validate submission timeliness.";
  }
  return "Upload quality looks acceptable for management review on this business date.";
}

function recommendedActions(row: AttentionBoardRow): string[] {
  const actions: string[] = [];
  if (row.attentionBand === "RED") {
    actions.push("Escalate to regional manager and trigger same-day outlet review.");
  }
  if (row.reasons.some((reason) => reason.toLowerCase().includes("stock variance"))) {
    actions.push("Request stock recount and reconcile expected vs reported closing balances.");
  }
  if (row.reasons.some((reason) => reason.toLowerCase().includes("upload"))) {
    actions.push("Follow up with outlet manager on daily upload SLA and submission controls.");
  }
  if (row.anomalyCount >= 2) {
    actions.push("Review open anomalies and assign ownership with a 24-hour closure target.");
  }
  if (actions.length === 0) {
    actions.push("Continue routine monitoring and maintain current control posture.");
  }
  return actions.slice(0, 4);
}

export default async function OutletDetailPage({ params }: OutletDetailPageProps): Promise<JSX.Element> {
  const row = await getOutletDetail(params.outletId);
  const safeRow =
    row ??
    ({
      outletId: params.outletId,
      outletName: "Outlet detail unavailable",
      licenseType: "N/A",
      zone: "N/A",
      locality: "N/A",
      city: "Bengaluru",
      state: "Karnataka",
      businessDate: new Date().toISOString().slice(0, 10),
      riskScore: 0,
      attentionBand: "GREEN",
      reasons: ["Outlet was not found in API response."],
      managementSummary: "No detail row was returned for this outlet id.",
      anomalyCount: 0,
      trendDirection: "STABLE",
      trendDelta: 0
    } satisfies AttentionBoardRow);

  const actions = recommendedActions(safeRow);

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-6 py-10">
      <header className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
        >
          Back to attention board
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{safeRow.outletName}</h1>
          <p className="text-muted-foreground">
            {safeRow.licenseType} - {safeRow.zone}, {safeRow.locality} ({safeRow.city}, {safeRow.state})
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Business date</CardDescription>
            <CardTitle className="text-xl">{safeRow.businessDate}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attention band</CardDescription>
            <CardTitle className="text-xl">
              <Badge className={attentionBadgeClass(safeRow.attentionBand)}>{safeRow.attentionBand}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk score</CardDescription>
            <CardTitle className="text-xl">{safeRow.riskScore}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Anomaly count</CardDescription>
            <CardTitle className="text-xl">{safeRow.anomalyCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk overview</CardTitle>
            <CardDescription>Management-level explanation of current risk posture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{safeRow.managementSummary}</p>
            <p className="text-muted-foreground">
              Trend: <span className="font-medium text-foreground">{safeRow.trendDirection}</span> (
              {safeRow.trendDelta >= 0 ? "+" : ""}
              {safeRow.trendDelta})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key issues today</CardTitle>
            <CardDescription>Top reasons driving the current attention score.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {safeRow.reasons.map((reason) => (
                <li key={reason} className="rounded-md border px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend summary</CardTitle>
            <CardDescription>Recent direction of outlet risk versus prior period.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{trendCopy(safeRow)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data quality notes</CardTitle>
            <CardDescription>Input reliability and upload quality considerations.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{dataQualityCopy(safeRow)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Action recommendations</CardTitle>
          <CardDescription>Suggested next actions for central-office follow-up.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {actions.map((action, index) => (
              <li key={action} className="rounded-md border px-3 py-2">
                <span className="mr-2 font-semibold text-muted-foreground">{index + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <RequiredActionsPanel outletId={safeRow.outletId} />
    </main>
  );
}
