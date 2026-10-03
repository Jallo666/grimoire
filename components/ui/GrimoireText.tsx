type Props = {
  children: React.ReactNode;
  // grigio (testo secondario)
  muted?: boolean;
  // più piccolo (es. note in fondo alla pagina)
  small?: boolean;
};

// Paragrafo di testo, con i colori del tema
export default function GrimoireText({ children, muted = false, small = false }: Props) {
  return (
    <p style={{ color: muted ? "var(--g-text-muted)" : "var(--g-text)", fontSize: small ? "0.75rem" : undefined }}>
      {children}
    </p>
  );
}
