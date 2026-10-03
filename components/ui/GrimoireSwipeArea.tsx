"use client";

import { useRef } from "react";
import styles from "./GrimoireSwipeArea.module.css";

type Props = {
  children: React.ReactNode;
  // dito verso sinistra (es. elemento successivo) / verso destra (es. precedente)
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  // da che lato è arrivato il contenuto attuale: anima l'entrata ("next" da destra, "prev" da sinistra)
  enterFrom?: "next" | "prev" | null;
};

// Area che riconosce lo swipe orizzontale e anima il cambio di contenuto.
// Per far ripartire l'animazione a ogni cambio, darle una key diversa (es. l'id dell'elemento).
// Lo swipe conta solo se è lungo almeno 60px e chiaramente orizzontale: così scorrere in giù
// un testo lungo non lo fa scattare per sbaglio.
export default function GrimoireSwipeArea({ children, onSwipeLeft, onSwipeRight, enterFrom = null }: Props) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  }

  const animation = enterFrom === "next" ? styles.fromRight : enterFrom === "prev" ? styles.fromLeft : "";

  return (
    <div className={`${styles.area} ${animation}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
