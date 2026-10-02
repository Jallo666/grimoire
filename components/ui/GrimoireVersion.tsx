"use client";

import { useTranslations } from "next-intl";
import { APP_VERSION } from "@/lib/version";

export default function GrimoireVersion() {
  const t = useTranslations("ui");

  return (
    <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--g-text-muted)", margin: "1rem 0 0" }}>
      {t("version", { version: APP_VERSION })}
    </p>
  );
}
