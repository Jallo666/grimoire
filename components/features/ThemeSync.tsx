"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setTheme } from "@/store/themeSlice";

export default function ThemeSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (dark: boolean) => {
      const t = dark ? "dark" : "light";
      dispatch(setTheme(t));
      document.body.classList.toggle("g-dark", dark);
      document.body.style.backgroundColor = "var(--g-body-bg)";
    };

    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [dispatch]);

  return null;
}
