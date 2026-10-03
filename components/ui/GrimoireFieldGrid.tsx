import styles from "./GrimoireFieldGrid.module.css";

// Mette i campi di un form su due colonne (da 768px), in ordine: 1° e 2° sulla prima riga, ecc.
// Sui telefoni una colonna sola, perché gli input hanno bisogno di tutta la larghezza.
// alwaysTwoColumns: due colonne anche sui telefoni, per valori brevi in sola lettura.
export default function GrimoireFieldGrid({ children, alwaysTwoColumns = false }: { children: React.ReactNode; alwaysTwoColumns?: boolean }) {
  return <div className={`${styles.grid}${alwaysTwoColumns ? ` ${styles.twoColumns}` : ""}`}>{children}</div>;
}
