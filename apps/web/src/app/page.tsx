import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-6 py-12">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        Ishakti Labs Demo
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">BarOps Authority</h1>
      <p className="max-w-2xl text-muted-foreground">
        A control and accountability layer above POS, Excel, and manual uploads. Identify
        which outlets need attention today and why.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
      >
        Open demo dashboard
      </Link>
    </main>
  );
}
