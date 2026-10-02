"use client";

import { useTranslations } from "next-intl";
import GrimoireButton from "@/components/ui/GrimoireButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <main className="container py-5 text-center">
      <h2 style={{ color: "var(--g-text)" }}>{t("somethingWentWrong")}</h2>
      <p style={{ color: "var(--g-text-muted)" }}>{error.message}</p>
      <GrimoireButton onClick={reset}>{t("retry")}</GrimoireButton>
    </main>
  );
}
