import styles from "./GrimoireFieldGrid.module.css";

// Mette i campi di un form su due colonne (da 768px), in ordine: 1° e 2° sulla prima riga, ecc.
// Sui telefoni una colonna sola, perché gli input hanno bisogno di tutta la larghezza.
export default function GrimoireFieldGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
