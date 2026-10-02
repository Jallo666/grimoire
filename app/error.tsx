"use client";

import { useTranslations } from "next-intl";
import GrimoirePage from "@/components/ui/GrimoirePage";
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
    <GrimoirePage centered>
      <h2 style={{ color: "var(--g-text)" }}>{t("somethingWentWrong")}</h2>
      <p style={{ color: "var(--g-text-muted)" }}>{error.message}</p>
      <GrimoireButton onClick={reset}>{t("retry")}</GrimoireButton>
    </GrimoirePage>
  );
}
