// Riga dei filtri per il desktop (da 992px), sempre visibile.
// Sotto i 992px è nascosta: i filtri stanno nella modale (GrimoireFilterModal),
// che si apre con l'icona GrimoireFilterButton.
export default function GrimoireFilterPanel({ children }: { children: React.ReactNode }) {
  return <div className="d-none d-lg-block">{children}</div>;
}
