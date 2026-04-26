import { Card } from "@/components/ui/card";

type StatusStripProps = {
  dataSource: string;
  lastRefreshedAt: string;
  businessDate: string;
  apiStatus: "Online" | "Unavailable";
};

export function StatusStrip({
  dataSource,
  lastRefreshedAt,
  businessDate,
  apiStatus
}: StatusStripProps): JSX.Element {
  return (
    <Card className="border-dashed">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">Data source:</strong> {dataSource}
        </span>
        <span>
          <strong className="text-foreground">Last refreshed:</strong> {lastRefreshedAt}
        </span>
        <span>
          <strong className="text-foreground">Business date:</strong> {businessDate}
        </span>
        <span>
          <strong className="text-foreground">API:</strong>{" "}
          <span className={apiStatus === "Online" ? "text-emerald-700" : "text-danger"}>{apiStatus}</span>
        </span>
      </div>
    </Card>
  );
}
