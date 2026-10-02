"use client";

import { useEffect, useId } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/themeSlice";
import { ME, UPDATE_PREFERENCES } from "@/lib/queries/users";
import { THEME_STORAGE_KEY, setPageTheme } from "./ThemeSync";

export default function ThemeToggle() {
  const theme = useAppSelector((s) => s.theme.value);
  const dispatch = useAppDispatch();
  // id unico: il toggle compare sia nella barra (desktop) sia nel menu laterale (mobile)
  const id = useId();
  const { data } = useQuery<{ me: { id: string } | null }>(ME);
  const [updatePreferences] = useMutation(UPDATE_PREFERENCES);

  useEffect(() => {
    setPageTheme(theme === "dark");
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    dispatch(setTheme(next));
    localStorage.setItem(THEME_STORAGE_KEY, next);
    if (data?.me) {
      updatePreferences({ variables: { defaultTheme: next } });
    }
  }

  return (
    <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        id={id}
        checked={theme === "dark"}
        onChange={toggle}
        style={{
          cursor: "pointer",
          // Il toggle sta sempre sul blu (navbar e menu laterale): acceso, Bootstrap lo farebbe
          // dello stesso blu e la pista sparirebbe. Pista bianca semitrasparente e bordo chiaro.
          backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.35)" : undefined,
          borderColor: "rgba(255, 255, 255, 0.6)",
        }}
      />
      <label
        className="form-check-label text-white small"
        htmlFor={id}
        style={{ cursor: "pointer" }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </label>
    </div>
  );
}
