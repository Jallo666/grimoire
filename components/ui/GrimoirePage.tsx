type Props = { children: React.ReactNode; centered?: boolean };

// Spazio sopra e sotto la pagina: 16px su tablet e telefono (py-3), 48px su desktop da 992px (py-lg-5)
export default function GrimoirePage({ children, centered }: Props) {
  return (
    <main className={`container py-3 py-lg-5${centered ? " text-center" : ""}`}>
      {children}
    </main>
  );
}
