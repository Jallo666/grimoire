"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";
import styles from "./GrimoireActionSheet.module.css";

export type SheetAction = {
  label: string;
  icon?: string;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
};

type Props = {
  title: string;
  actions: SheetAction[];
  onClose: () => void;
};

// Menu che sale dal basso con le azioni disponibili (es. per una riga di tabella su mobile).
// Si mostra quando viene messo nella pagina e si chiude con "Annulla", toccando lo sfondo o con Esc.
// Toccando un'azione il menu prima riscende, poi l'azione parte.
export default function GrimoireActionSheet({ title, actions, onClose }: Props) {
  const t = useTranslations("ui");
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [pending, setPending] = useState<SheetAction | null>(null);

  function close(action: SheetAction | null = null) {
    setPending(action);
    setClosing(true);
  }

  // Finita l'animazione di chiusura: toglie il menu ed esegue l'azione scelta
  function handleAnimationEnd(e: React.AnimationEvent) {
    if (!closing || e.target !== e.currentTarget) return;
    onClose();
    if (pending?.href) router.push(pending.href);
    else pending?.onClick?.();
  }

  // Blocca lo scroll della pagina e chiude con Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setClosing(true);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const closingClass = closing ? ` ${styles.closing}` : "";

  return (
    <>
      <div className={`${styles.backdrop}${closingClass}`} onClick={() => close()} />
      <div
        className={`${styles.sheet}${closingClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.handle} />
        <div className={styles.title}>{title}</div>
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.item}${a.danger ? ` ${styles.danger}` : ""}`}
            style={{ animationDelay: `${120 + i * 40}ms` }}
            onClick={() => close(a)}
          >
            {a.icon && <GrimoireIcon name={a.icon} size={18} />}
            {a.label}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.item} ${styles.cancel}`}
          style={{ animationDelay: `${120 + actions.length * 40}ms` }}
          onClick={() => close()}
        >
          {t("cancel")}
        </button>
      </div>
    </>
  );
}
