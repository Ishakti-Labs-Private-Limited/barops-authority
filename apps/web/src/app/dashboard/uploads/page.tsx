"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LanguageSelector } from "@/components/dashboard/language-selector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { helperText, parseLanguageMode, t, withLang } from "@/lib/demo-i18n";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const PREVIEW_LIMIT = 8;

type SourceType = "pos_export" | "manual_sheet" | "stock_count";

type UploadSimulationResponse = {
  simulationId: string;
  sourceType: string;
  fileName: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  highlights: string[];
  recalculationNote: string;
  status: string;
};

const SOURCE_LABELS: Record<SourceType, string> = {
  pos_export: "POS export",
  manual_sheet: "Manual sheet",
  stock_count: "Stock count"
};

const REQUIRED_FIELDS_BY_SOURCE: Record<SourceType, string[]> = {
  pos_export: ["outlet_id", "business_date", "net_revenue"],
  manual_sheet: ["outlet_id", "business_date", "notes"],
  stock_count: ["outlet_id", "business_date", "product_sku", "reported_closing_stock"]
};

const TEMPLATE_DOWNLOADS: Array<{
  sourceType: SourceType;
  label: string;
  href: string;
}> = [
  {
    sourceType: "pos_export",
    label: "POS export template",
    href: "/templates/pos-export-template.csv"
  },
  {
    sourceType: "manual_sheet",
    label: "Manual sheet template",
    href: "/templates/manual-sheet-template.csv"
  },
  {
    sourceType: "stock_count",
    label: "Stock count template",
    href: "/templates/stock-count-template.csv"
  }
];

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

function inferMapping(headers: string[], sourceType: SourceType): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of REQUIRED_FIELDS_BY_SOURCE[sourceType]) {
    const directMatch = headers.find((header) => header === field);
    if (directMatch) {
      mapping[field] = directMatch;
      continue;
    }
    const fuzzyMatch = headers.find((header) => header.includes(field.replaceAll("_", "")));
    if (fuzzyMatch) {
      mapping[field] = fuzzyMatch;
    }
  }
  return mapping;
}

function validateRows(
  rows: Record<string, string>[],
  sourceType: SourceType,
  mapping: Record<string, string>,
  lang: ReturnType<typeof parseLanguageMode>
): { validRows: number; invalidRows: number; errors: string[] } {
  const errors: string[] = [];
  let validRows = 0;
  let invalidRows = 0;

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2;

    for (const field of REQUIRED_FIELDS_BY_SOURCE[sourceType]) {
      const mappedHeader = mapping[field];
      const value = mappedHeader ? row[mappedHeader] : "";
      if (!value || value.trim().length === 0) {
        rowErrors.push(
          `${t(lang, "Row", "ಸಾಲು")} ${rowNumber}: ${t(lang, "missing", "ಕಾಣೆಯಾಗಿದೆ")} ${field}`
        );
      }
    }

    const dateHeader = mapping.business_date;
    if (dateHeader && row[dateHeader]) {
      const asDate = new Date(row[dateHeader]);
      if (Number.isNaN(asDate.getTime())) {
        rowErrors.push(`${t(lang, "Row", "ಸಾಲು")} ${rowNumber}: ${t(lang, "invalid business_date", "ಅಮಾನ್ಯ business_date")}`);
      }
    }

    if (sourceType === "pos_export") {
      const revenueHeader = mapping.net_revenue;
      if (revenueHeader && row[revenueHeader] && Number.isNaN(Number(row[revenueHeader]))) {
        rowErrors.push(
          `${t(lang, "Row", "ಸಾಲು")} ${rowNumber}: ${t(lang, "net_revenue must be numeric", "net_revenue ಸಂಖ್ಯೆ ಆಗಿರಬೇಕು")}`
        );
      }
    }

    if (sourceType === "stock_count") {
      const stockHeader = mapping.reported_closing_stock;
      if (stockHeader && row[stockHeader] && Number.isNaN(Number(row[stockHeader]))) {
        rowErrors.push(
          `${t(lang, "Row", "ಸಾಲು")} ${rowNumber}: ${t(
            lang,
            "reported_closing_stock must be numeric",
            "reported_closing_stock ಸಂಖ್ಯೆ ಆಗಿರಬೇಕು"
          )}`
        );
      }
    }

    if (rowErrors.length > 0) {
      invalidRows += 1;
      errors.push(...rowErrors);
      return;
    }
    validRows += 1;
  });

  return { validRows, invalidRows, errors: errors.slice(0, 30) };
}

export default function UploadSimulationPage(): JSX.Element {
  const searchParams = useSearchParams();
  const lang = parseLanguageMode(searchParams.get("lang") ?? undefined);
  const [sourceType, setSourceType] = useState<SourceType>("pos_export");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadSimulationResponse | null>(null);

  const requiredFields = REQUIRED_FIELDS_BY_SOURCE[sourceType];

  const validation = useMemo(
    () => validateRows(rows, sourceType, columnMapping, lang),
    [rows, sourceType, columnMapping, lang]
  );

  const previewRows = useMemo(() => rows.slice(0, PREVIEW_LIMIT), [rows]);

  async function onCsvSelect(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    setResult(null);
    setSubmitError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setFileName(file.name);

    const content = await file.text();
    const parsed = parseCsv(content);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setSubmitError(
        t(
          lang,
          "The selected CSV has no usable data rows. Please upload a file with headers and at least one row.",
          "ಆಯ್ದ CSV ನಲ್ಲಿ ಬಳಕೆ ಮಾಡಲು ಯೋಗ್ಯ ಸಾಲುಗಳಿಲ್ಲ. ಹೆಡರ್ ಮತ್ತು ಕನಿಷ್ಠ ಒಂದು ಸಾಲು ಇರುವ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."
        )
      );
    }
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setColumnMapping(inferMapping(parsed.headers, sourceType));
  }

  function onSourceTypeChange(nextType: SourceType): void {
    setSourceType(nextType);
    setResult(null);
    if (headers.length > 0) {
      setColumnMapping(inferMapping(headers, nextType));
    } else {
      setColumnMapping({});
    }
  }

  function onMappingChange(field: string, header: string): void {
    setResult(null);
    setColumnMapping((current) => ({
      ...current,
      [field]: header
    }));
  }

  async function onSubmitSimulation(): Promise<void> {
    setSubmitError(null);
    setResult(null);

    if (rows.length === 0) {
      setSubmitError(t(lang, "Upload a CSV file first.", "ಮೊದಲು CSV ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."));
      return;
    }

    const missingMapping = requiredFields.filter((field) => !columnMapping[field]);
    if (missingMapping.length > 0) {
      setSubmitError(
        t(lang, "Map required columns before submit:", "ಸಲ್ಲಿಸುವ ಮೊದಲು ಅಗತ್ಯ ಕಾಲಮ್ ಮ್ಯಾಪಿಂಗ್ ಮಾಡಿ:") +
          ` ${missingMapping.join(", ")}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
      const response = await fetch(`${baseUrl}/uploads/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceType,
          fileName: fileName || "upload.csv",
          totalRows: rows.length,
          validRows: validation.validRows,
          invalidRows: validation.invalidRows,
          columnMapping,
          previewRows,
          validationErrors: validation.errors
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as UploadSimulationResponse;
      setResult(payload);
    } catch {
      setSubmitError(
        t(
          lang,
          "Unable to submit upload simulation right now. Please check API and retry.",
          "ಈಗ ಅಪ್‌ಲೋಡ್ ಅನುಕರಣ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. API ಪರಿಶೀಲಿಸಿ ಮರುಪ್ರಯತ್ನಿಸಿ."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-6 py-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Upload simulation</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                lang,
                "Demo how POS exports, manual sheets, and stock counts enter BarOps Authority.",
                "POS ಎಕ್ಸ್‌ಪೋರ್ಟ್, ಮಾನವೀಯ ಶೀಟ್ ಮತ್ತು ಸ್ಟಾಕ್ ಎಣಿಕೆ ಡೇಟಾ BarOps ಗೆ ಹೇಗೆ ಬರುತ್ತದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತದೆ."
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                lang,
                "Use a sample template or your existing CSV export to preview how BarOps ingests outlet data.",
                "ಸ್ಯಾಂಪಲ್ ಟೆಂಪ್ಲೇಟ್ ಅಥವಾ ನಿಮ್ಮ CSV ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಬಳಸಿ BarOps ಡೇಟಾ ಸ್ವೀಕಾರ ಪೂರ್ವವೀಕ್ಷಣೆ ನೋಡಿ."
              )}
            </p>
            {helperText(
              lang,
              "ಸಹಾಯಕ ಮೋಡ್‌ನಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಪಠ್ಯದ ಕೆಳಗೆ ಕನ್ನಡ ನೆರವು ಪಠ್ಯ ಕಾಣಿಸುತ್ತದೆ."
            ) ? (
              <p className="text-xs text-muted-foreground">
                {helperText(lang, "ಸಹಾಯಕ ಮೋಡ್‌ನಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಪಠ್ಯದ ಕೆಳಗೆ ಕನ್ನಡ ನೆರವು ಪಠ್ಯ ಕಾಣಿಸುತ್ತದೆ.")}
              </p>
            ) : null}
          </div>
          <LanguageSelector />
          <Link
            href={withLang("/dashboard", lang)}
            className="inline-flex items-center rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(lang, "Back to dashboard", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ")}
          </Link>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-sm font-medium">{t(lang, "Need a ready-to-use sample file?", "ತಕ್ಷಣ ಬಳಕೆಗೆ ಸ್ಯಾಂಪಲ್ ಫೈಲ್ ಬೇಕೆ?")}</p>
          <p className="text-xs text-muted-foreground">
              {t(
                lang,
                "Download a CSV template, fill in your data, and upload to simulate a realistic ingestion flow.",
                "CSV ಟೆಂಪ್ಲೇಟ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ, ನಿಮ್ಮ ಡೇಟಾ ತುಂಬಿ, ವಾಸ್ತವಿಕ ಇಂಜೆಕ್ಷನ್ ಅನುಕರಣ ನೋಡಿ."
              )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATE_DOWNLOADS.map((template) => (
              <a
                key={template.sourceType}
                href={template.href}
                download
                className={`rounded-md border px-3 py-1 text-xs hover:bg-muted ${
                  sourceType === template.sourceType ? "border-primary text-primary" : "text-muted-foreground"
                }`}
              >
                {t(lang, "Download", "ಡೌನ್‌ಲೋಡ್")} {template.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t(lang, "1) Source type", "1) ಮೂಲ ಪ್ರಕಾರ")}</CardTitle>
            <CardDescription>Select the source format being uploaded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(SOURCE_LABELS) as SourceType[]).map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === option}
                  onChange={() => onSourceTypeChange(option)}
                />
                <span className="text-sm">{SOURCE_LABELS[option]}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(lang, "2) CSV upload", "2) CSV ಅಪ್‌ಲೋಡ್")}</CardTitle>
            <CardDescription>Choose a CSV export from client data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              onChange={onCsvSelect}
            />
            <p className="text-xs text-muted-foreground">
              Accepted format: CSV with header row and business records in subsequent rows.
            </p>
            {fileName ? (
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">File:</span> {fileName}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(lang, "3) Validation snapshot", "3) ಪರಿಶೀಲನೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್")}</CardTitle>
            <CardDescription>Quick trust check before submit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Total rows: <span className="font-semibold">{rows.length}</span>
            </p>
            <p>
              Valid rows: <span className="font-semibold text-emerald-700">{validation.validRows}</span>
            </p>
            <p>
              Invalid rows: <span className="font-semibold text-danger">{validation.invalidRows}</span>
            </p>
            {validation.errors.length > 0 ? (
              <p className="text-xs text-muted-foreground">Validation errors are listed below for correction.</p>
            ) : (
              <p className="text-xs text-muted-foreground">No validation issues detected so far.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Column mapping</CardTitle>
            <CardDescription>Map required BarOps fields to uploaded CSV headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredFields.map((field) => (
              <label key={field} className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field}</span>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={columnMapping[field] ?? ""}
                  onChange={(event) => onMappingChange(field, event.target.value)}
                >
                  <option value="">Select column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation errors</CardTitle>
            <CardDescription>Rows requiring correction before final ingestion.</CardDescription>
          </CardHeader>
          <CardContent>
            {validation.errors.length === 0 ? (
              <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                No validation errors to display.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto text-sm">
                {validation.errors.map((error) => (
                  <li key={error} className="rounded-md border px-3 py-2">
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Preview rows</CardTitle>
          <CardDescription>
            First {PREVIEW_LIMIT} row(s) from uploaded file for business-side verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewRows.length === 0 ? (
            <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              Upload a CSV to preview data rows.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={`row-${index}`}>
                    {headers.map((header) => (
                      <TableCell key={`${header}-${index}`}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || rows.length === 0}
            onClick={onSubmitSimulation}
          >
            {isSubmitting
              ? t(lang, "Submitting simulation...", "ಅನುಕರಣ ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...")
              : t(lang, "Submit simulation", "ಅನುಕರಣ ಸಲ್ಲಿಸಿ")}
          </button>
          <Badge variant="secondary">Demo mode</Badge>
        </div>
        {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
      </section>

      {result ? (
        <Card className="border-emerald-300">
          <CardHeader>
            <CardTitle className="text-emerald-700">Upload simulation completed</CardTitle>
            <CardDescription>
              Simulation ID: {result.simulationId} | Status: {result.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Processed <span className="font-semibold">{result.totalRows}</span> row(s) from{" "}
              <span className="font-semibold">{result.fileName}</span> ({SOURCE_LABELS[sourceType]}).
            </p>
            <p>
              Accepted: <span className="font-semibold text-emerald-700">{result.acceptedRows}</span> | Rejected:{" "}
              <span className="font-semibold text-danger">{result.rejectedRows}</span>
            </p>
            <ul className="space-y-2">
              {result.highlights.map((highlight) => (
                <li key={highlight} className="rounded-md border px-3 py-2">
                  {highlight}
                </li>
              ))}
            </ul>
            <p className="rounded-md border bg-muted/30 px-3 py-2">
              <span className="font-medium">Attention impact:</span> {result.recalculationNote}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
