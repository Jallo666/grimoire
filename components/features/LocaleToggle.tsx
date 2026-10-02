"use client";

import { useLocale } from "next-intl";

export default function LocaleToggle() {
  const locale = useLocale();

  function toggle() {
    const next = locale === "it" ? "en" : "it";
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-sm btn-outline-light"
      style={{ minWidth: "38px", fontWeight: 600, letterSpacing: "0.05em" }}
    >
      {locale === "it" ? "EN" : "IT"}
    </button>
  );
}
