"use client";

import { useEffect } from "react";
import styles from "./GrimoireToast.module.css";

type Props = {
  message: string | null;
  onHide: () => void;
};

// Quanto resta visibile il messaggio
const DURATION_MS = 3500;

// Messaggio breve in basso al centro (es. il risultato di un'azione in blocco).
// Si mostra quando "message" non è null e dopo qualche secondo chiama onHide.
export default function GrimoireToast({ message, onHide }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
