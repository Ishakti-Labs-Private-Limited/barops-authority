import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionBoardRow } from "@/components/dashboard/attention-table";
import { type LanguageMode, helperText, t } from "@/lib/demo-i18n";

type CloseConfidencePanelProps = {
  row: AttentionBoardRow;
  lang: LanguageMode;
};

function closeRuleNote(licenseType: string): string {
  if (licenseType.toUpperCase().includes("CL9")) {
    return "CL9 outlets should complete close upload before next-day trading review and avoid back-dated corrections.";
  }
  if (licenseType.toUpperCase().includes("CL7")) {
    return "CL7 outlets should complete daily close with same-night stock and revenue reconciliation.";
  }
  return "Outlet should complete daily close upload and maintain traceable correction notes.";
}

export function CloseConfidencePanel({ row, lang }: CloseConfidencePanelProps): JSX.Element {
  const confidenceTone =
    row.closeConfidenceScore < 55
      ? "text-danger"
      : row.closeConfidenceScore < 70
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Close confidence & compliance</CardTitle>
        <CardDescription>
          {t(
            lang,
            "Compact control signal for upload discipline, correction behavior, and close reliability.",
            "ಅಪ್‌ಲೋಡ್ ಶಿಸ್ತಿನ, ತಿದ್ದುಪಡಿ ವರ್ತನೆ ಮತ್ತು ಕ್ಲೋಸ್ ನಂಬಿಕೆಗೆ ಸಂಕ್ಷಿಪ್ತ ನಿಯಂತ್ರಣ ಸೂಚನೆ."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">{t(lang, "Close confidence", "ಕ್ಲೋಸ್ ವಿಶ್ವಾಸ")}</p>
            <p className={`text-2xl font-semibold ${confidenceTone}`}>{row.closeConfidenceScore}/100</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">{t(lang, "Last upload time", "ಕೊನೆಯ ಅಪ್‌ಲೋಡ್ ಸಮಯ")}</p>
            <p className="font-medium">{row.lastUploadTime}</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">{t(lang, "Upload timeliness", "ಅಪ್‌ಲೋಡ್ ಸಮಯಪಾಲನೆ")}</p>
            <Badge variant={row.uploadTimelinessStatus === "ON_TIME" ? "secondary" : "destructive"}>
              {row.uploadTimelinessStatus}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-md border px-3 py-2">
            {t(lang, "Post-close corrections (7d):", "ಕ್ಲೋಸ್ ನಂತರದ ತಿದ್ದುಪಡಿಗಳು (7 ದಿನ):")}{" "}
            <span className="font-semibold">{row.postCloseCorrectionCount7d}</span>
          </p>
          <p className="rounded-md border px-3 py-2">
            {t(lang, "Recent unresolved issues (30d):", "ಇತ್ತೀಚಿನ ಪರಿಹಾರವಾಗದ ವಿಷಯಗಳು (30 ದಿನ):")}{" "}
            <span className="font-semibold">{row.recentUnresolvedIssueCount}</span>
          </p>
        </div>
        <p className="rounded-md border bg-muted/30 px-3 py-2">
          <span className="font-medium">{t(lang, "Close rule note:", "ಕ್ಲೋಸ್ ನಿಯಮ ಟಿಪ್ಪಣಿ:")}</span>{" "}
          {closeRuleNote(row.licenseType)}
        </p>
        <p className="rounded-md border bg-muted/30 px-3 py-2">
          <span className="font-medium">{t(lang, "Compliance note:", "ಅನುಸರಣೆ ಟಿಪ್ಪಣಿ:")}</span> {row.complianceNote}
        </p>
        {helperText(lang, "ಮುಖ್ಯ ನಿಯಂತ್ರಣ ಪದಗಳು: Risk score, Anomaly, Upload, Due date.") ? (
          <p className="text-xs text-muted-foreground">
            {helperText(lang, "ಮುಖ್ಯ ನಿಯಂತ್ರಣ ಪದಗಳು: Risk score, Anomaly, Upload, Due date.")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
