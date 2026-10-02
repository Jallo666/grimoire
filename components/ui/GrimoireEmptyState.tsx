type Props = { message: string; children?: React.ReactNode };

export default function GrimoireEmptyState({ message, children }: Props) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 0" }}>
      <p style={{ color: "var(--g-text-muted)", marginBottom: "1rem" }}>{message}</p>
      {children}
    </div>
  );
}
