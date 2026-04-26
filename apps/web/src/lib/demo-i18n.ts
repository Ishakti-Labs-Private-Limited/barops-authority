export type LanguageMode = "en" | "kn" | "helper";

export function parseLanguageMode(value: string | undefined): LanguageMode {
  if (value === "kn" || value === "helper" || value === "en") {
    return value;
  }
  return "en";
}

export function t(lang: LanguageMode, english: string, kannada: string): string {
  return lang === "kn" ? kannada : english;
}

export function helperText(lang: LanguageMode, kannada: string): string | null {
  return lang === "helper" ? kannada : null;
}

export function withLang(path: string, lang: LanguageMode): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}`;
}

export const glossary = {
  riskScore: { en: "Risk score", kn: "ರಿಸ್ಕ್ ಸ್ಕೋರ್" },
  anomaly: { en: "Anomaly", kn: "ಅಸಾಮಾನ್ಯತೆ" },
  upload: { en: "Upload", kn: "ಅಪ್‌ಲೋಡ್" },
  open: { en: "OPEN", kn: "ತೆರೆದಿದೆ" },
  acknowledged: { en: "ACKNOWLEDGED", kn: "ಗಮನಿಸಲಾಗಿದೆ" },
  closed: { en: "CLOSED", kn: "ಮುಚ್ಚಲಾಗಿದೆ" },
  dueDate: { en: "Due date", kn: "ನಿಗದಿತ ದಿನಾಂಕ" },
  weeklyReviewSummary: { en: "Weekly review summary", kn: "ವಾರವಾರದ ವಿಮರ್ಶಾ ಸಾರಾಂಶ" },
  stockVariance: { en: "Stock variance", kn: "ಸ್ಟಾಕ್ ವ್ಯತ್ಯಾಸ" }
} as const;
