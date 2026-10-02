"use client";

import { useEffect, useRef, useState } from "react";
import GrimoireInput from "./GrimoireInput";

type Props = {
  id: string;
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
};

// Quanto aspettare dopo l'ultima lettera prima di cercare
const DELAY_MS = 300;

// Campo di ricerca: il testo si aggiorna subito mentre scrivi,
// ma onSearch viene chiamato solo quando smetti di scrivere per 300ms.
// Così non parte una ricerca a ogni lettera.
export default function GrimoireSearchInput({ id, value, onSearch, placeholder }: Props) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Se la ricerca cambia da fuori (es. cambio tab che azzera i filtri), aggiorna il testo
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  // Annulla la ricerca in attesa se il componente sparisce
  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const next = e.target.value;
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(next), DELAY_MS);
  }

  return <GrimoireInput id={id} type="text" value={text} onChange={handleChange} placeholder={placeholder} />;
}
