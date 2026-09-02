"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/themeSlice";

export default function ThemeToggle() {
  const theme = useAppSelector((s) => s.theme.value);
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.body.classList.toggle("g-dark", theme === "dark");
    document.body.style.backgroundColor = "var(--g-body-bg)";
  }, [theme]);

  function toggle() {
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  }

  return (
    <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        id="themeToggle"
        checked={theme === "dark"}
        onChange={toggle}
        style={{ cursor: "pointer" }}
      />
      <label
        className="form-check-label text-white small"
        htmlFor="themeToggle"
        style={{ cursor: "pointer" }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </label>
    </div>
  );
}
