import styles from "./GrimoirePage.module.css";

// fillHeight: sotto i 992px la pagina è alta quanto lo schermo e la tabella con fillHeight
// prende lo spazio rimasto (vedi GrimoirePage.module.css)
type Props = { children: React.ReactNode; centered?: boolean; fillHeight?: boolean };

// Spazio sopra e sotto la pagina: 16px su tablet e telefono (py-3), 48px su desktop da 992px (py-lg-5)
export default function GrimoirePage({ children, centered, fillHeight }: Props) {
  return (
    <main className={`container py-3 py-lg-5${centered ? " text-center" : ""}${fillHeight ? ` ${styles.fill}` : ""}`}>
      {children}
    </main>
  );
}
