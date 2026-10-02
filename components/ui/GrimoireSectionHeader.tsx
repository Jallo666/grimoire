type Props = { children: React.ReactNode; action?: React.ReactNode };

export default function GrimoireSectionHeader({ children, action }: Props) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h5 className="mb-0" style={{ color: "var(--g-text)" }}>{children}</h5>
      {action && <div>{action}</div>}
    </div>
  );
}
