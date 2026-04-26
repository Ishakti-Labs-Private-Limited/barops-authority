"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type IssueStatus = "OPEN" | "ACKNOWLEDGED" | "CLOSED";

type ExceptionIssue = {
  issueId: string;
  outletId: string;
  outletName: string;
  issueTitle: string;
  status: IssueStatus;
  owner: string;
  dueDate: string;
  closureNote: string;
  repeatCount: number;
  overdue: boolean;
};

type RequiredActionsPanelProps = {
  outletId: string;
};

function statusBadgeClass(status: IssueStatus): string {
  if (status === "CLOSED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }
  if (status === "ACKNOWLEDGED") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }
  return "bg-danger text-danger-foreground border-transparent";
}

export function RequiredActionsPanel({ outletId }: RequiredActionsPanelProps): JSX.Element {
  const [issues, setIssues] = useState<ExceptionIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);

  useEffect(() => {
    void loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  async function loadIssues(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
      const response = await fetch(`${baseUrl}/exceptions/outlets/${outletId}`, {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const payload = (await response.json()) as ExceptionIssue[];
      setIssues(payload);
    } catch {
      setError("Unable to load required actions right now.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveIssue(issueId: string, patch: Partial<ExceptionIssue>): Promise<void> {
    const currentIssue = issues.find((issue) => issue.issueId === issueId);
    if (!currentIssue) {
      return;
    }
    const nextIssue = { ...currentIssue, ...patch };
    setSavingIssueId(issueId);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
      const response = await fetch(`${baseUrl}/exceptions/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextIssue.status,
          owner: nextIssue.owner,
          dueDate: nextIssue.dueDate,
          closureNote: nextIssue.closureNote
        })
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const updated = (await response.json()) as ExceptionIssue;
      setIssues((prev) => prev.map((issue) => (issue.issueId === issueId ? updated : issue)));
    } catch {
      setError("Unable to save issue update. Please retry.");
    } finally {
      setSavingIssueId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required actions</CardTitle>
        <CardDescription>
          Demo exception-closure workflow with ownership, due dates, and closure evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading required actions...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {!loading && issues.length === 0 ? (
          <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            No action items are currently available for this outlet.
          </p>
        ) : null}
        {issues.map((issue) => (
          <div key={issue.issueId} className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium">{issue.issueTitle}</p>
              <div className="flex items-center gap-2">
                <Badge className={statusBadgeClass(issue.status)}>{issue.status}</Badge>
                {issue.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Repeat count: {issue.repeatCount}</p>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Status</span>
                <select
                  value={issue.status}
                  className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  onChange={(event) =>
                    setIssues((prev) =>
                      prev.map((item) =>
                        item.issueId === issue.issueId
                          ? { ...item, status: event.target.value as IssueStatus }
                          : item
                      )
                    )
                  }
                >
                  <option value="OPEN">OPEN</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Owner</span>
                <input
                  value={issue.owner}
                  className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  onChange={(event) =>
                    setIssues((prev) =>
                      prev.map((item) =>
                        item.issueId === issue.issueId ? { ...item, owner: event.target.value } : item
                      )
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Due date</span>
                <input
                  type="date"
                  value={issue.dueDate}
                  className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  onChange={(event) =>
                    setIssues((prev) =>
                      prev.map((item) =>
                        item.issueId === issue.issueId ? { ...item, dueDate: event.target.value } : item
                      )
                    )
                  }
                />
              </label>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="text-muted-foreground">Closure note</span>
              <textarea
                value={issue.closureNote}
                className="min-h-16 w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Add closure evidence or management note"
                onChange={(event) =>
                  setIssues((prev) =>
                    prev.map((item) =>
                      item.issueId === issue.issueId ? { ...item, closureNote: event.target.value } : item
                    )
                  )
                }
              />
            </label>
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-60"
              disabled={savingIssueId === issue.issueId}
              onClick={() => saveIssue(issue.issueId, issue)}
            >
              {savingIssueId === issue.issueId ? "Saving..." : "Save action update"}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
