type Props = { children: React.ReactNode; centered?: boolean };

export default function GrimoirePage({ children, centered }: Props) {
  return (
    <main className={`container py-5${centered ? " text-center" : ""}`}>
      {children}
    </main>
  );
}
