type Props = { children: React.ReactNode };

export default function GrimoireInlineGroup({ children }: Props) {
  return (
    <div className="d-flex gap-2 align-items-center">
      {children}
    </div>
  );
}
