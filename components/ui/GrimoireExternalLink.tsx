type Props = { href: string; children: React.ReactNode };

// Link a un sito esterno: si apre in una nuova scheda, col colore del testo intorno
export default function GrimoireExternalLink({ href, children }: Props) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
      {children}
    </a>
  );
}
