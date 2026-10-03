type Props = {
  label: string;
  value: string | null | undefined;
  // testo lungo su più righe (es. una descrizione): mantiene gli a capo
  multiline?: boolean;
};

// Campo in sola lettura: etichetta piccola in maiuscolo e valore sotto.
// Se il valore è vuoto non mostra niente.
export default function GrimoireField({ label, value, multiline = false }: Props) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <div style={{ fontSize: "0.75rem", color: "var(--g-text-muted)", fontWeight: 500, marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ color: "var(--g-text)", fontSize: "0.925rem", whiteSpace: multiline ? "pre-wrap" : undefined, lineHeight: multiline ? 1.65 : undefined }}>
        {value}
      </div>
    </div>
  );
}
