type Props = { children: React.ReactNode };

export default function GrimoireModalActions({ children }: Props) {
  return (
    <div className="d-flex justify-content-end gap-2 mt-3">
      {children}
    </div>
  );
}
