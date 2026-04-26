type GlossaryTermProps = {
  label: string;
  help: string;
};

export function GlossaryTerm({ label, help }: GlossaryTermProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <span
        role="note"
        aria-label={`${label} help`}
        title={help}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-muted-foreground"
      >
        i
      </span>
    </span>
  );
}
