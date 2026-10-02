type Props = {
  lines?: number;
  label?: boolean;
};

// Segnaposto grigio che pulsa mentre i dati arrivano: un'etichetta corta e alcune righe di testo.
// Con più righe l'ultima è più corta, come la fine di un paragrafo.
export default function GrimoireSkeletonText({ lines = 1, label = true }: Props) {
  return (
    <div className="placeholder-glow mb-3">
      {label && <span className="placeholder col-3 rounded d-block mb-2" style={{ height: "12px" }} />}
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className={`placeholder rounded d-block mb-1 ${lines > 1 && i === lines - 1 ? "col-7" : "col-12"}`}
          style={{ height: "14px" }}
        />
      ))}
    </div>
  );
}
