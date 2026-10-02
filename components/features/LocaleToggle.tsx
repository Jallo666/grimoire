"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery } from "@apollo/client/react";
import { ME, UPDATE_PREFERENCES } from "@/lib/queries/users";

const LOCALES = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

export default function LocaleToggle() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useQuery<{ me: { id: string } | null }>(ME);
  const [updatePreferences] = useMutation(UPDATE_PREFERENCES);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(code: string) {
    setOpen(false);
    if (code === locale) return;
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    if (data?.me) {
      updatePreferences({ variables: { defaultLocale: code } });
    }
    window.location.reload();
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ minWidth: "62px" }}
      >
        <i className="bi bi-globe2" style={{ fontSize: "0.75rem" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{current.code.toUpperCase()}</span>
        <i className="bi bi-chevron-down" style={{ fontSize: "0.6rem", opacity: 0.7 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            minWidth: "130px",
            zIndex: 1050,
            backgroundColor: "var(--g-card-bg)",
            border: "1px solid var(--g-card-border)",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className="d-flex align-items-center gap-2 w-100 border-0 px-3 py-2 text-start"
              style={{
                background: l.code === locale ? "var(--g-sidebar-active, rgba(var(--bs-primary-rgb),0.1))" : "transparent",
                color: "var(--g-text)",
                fontSize: "0.875rem",
                fontWeight: l.code === locale ? 600 : 400,
                cursor: "pointer",
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
