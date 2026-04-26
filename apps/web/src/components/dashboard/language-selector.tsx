"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type LanguageMode, parseLanguageMode } from "@/lib/demo-i18n";

const OPTIONS: Array<{ value: LanguageMode; label: string }> = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "helper", label: "English + ಕನ್ನಡ" }
];

export function LanguageSelector(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = parseLanguageMode(searchParams.get("lang") ?? undefined);

  return (
    <label className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
      <span>Language</span>
      <select
        className="bg-transparent text-xs"
        value={lang}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("lang", event.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
