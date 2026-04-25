import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  tone?: "default" | "danger" | "warning" | "success";
};

export function KpiCard({ label, value, tone = "default" }: KpiCardProps): JSX.Element {
  const valueClassName =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "success"
          ? "text-emerald-600"
          : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
