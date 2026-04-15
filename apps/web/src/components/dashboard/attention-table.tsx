import type { OutletAttention } from "@barops/shared-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AttentionTableProps = {
  rows: OutletAttention[];
};

export function AttentionTable({ rows }: AttentionTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outlets requiring attention today</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Outlet</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Top reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.outletId}>
                <TableCell className="font-medium">{row.outletName}</TableCell>
                <TableCell>{`${row.city}, ${row.state}`}</TableCell>
                <TableCell>
                  <Badge variant={row.riskScore >= 75 ? "destructive" : "secondary"}>
                    {row.riskScore}
                  </Badge>
                </TableCell>
                <TableCell>{row.reasons.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
