"use client";

export function PrintSummaryButton(): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted print:hidden"
    >
      Print summary
    </button>
  );
}
