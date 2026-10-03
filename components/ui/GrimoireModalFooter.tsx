import GrimoireAlert from "./GrimoireAlert";
import styles from "./GrimoireModalFooter.module.css";

type Props = {
  // Bottoni a destra (es. Annulla / Salva)
  children?: React.ReactNode;
  // Facoltativi: qualcosa a sinistra (es. Modifica) e al centro (es. ‹ 3 / 42 ›)
  start?: React.ReactNode;
  center?: React.ReactNode;
  // Errore da mostrare sopra i bottoni: testo, oppure errore del server (tradotto da GrimoireAlert)
  error?: unknown;
};

// Footer standard delle modali: da passare a GrimoireModal come "footer".
// Tutte le modali mettono i bottoni qui, mai dentro il contenuto.
export default function GrimoireModalFooter({ children, start, center, error }: Props) {
  return (
    <div className="w-100">
      {!!error && <GrimoireAlert error={error} />}
      <div className={styles.row}>
        <div>{start}</div>
        <div>{center}</div>
        <div className={styles.end}>{children}</div>
      </div>
    </div>
  );
}
