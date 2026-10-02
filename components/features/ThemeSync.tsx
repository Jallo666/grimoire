"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setTheme } from "@/store/themeSlice";

export const THEME_STORAGE_KEY = "grimoire-theme";

// L'unico interruttore del tema: data-bs-theme sul <body>.
// Cambia sia i nostri colori (--g-… in styles/palette.css) sia quelli di Bootstrap.
// I componenti non devono sapere quale tema è attivo: usano solo le variabili --g-….
export function setPageTheme(dark: boolean) {
  document.body.setAttribute("data-bs-theme", dark ? "dark" : "light");
  document.body.style.backgroundColor = "var(--g-body-bg)";
}

export function applyTheme(dark: boolean, dispatch: ReturnType<typeof useAppDispatch>) {
  dispatch(setTheme(dark ? "dark" : "light"));
  setPageTheme(dark);
}

export default function ThemeSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      applyTheme(stored === "dark", dispatch);
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(mq.matches, dispatch);

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches, dispatch);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [dispatch]);

  return null;
}
