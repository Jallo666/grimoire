"use client";

import { useTranslations } from "next-intl";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
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
    <GrimoirePage>
      <GrimoirePageTitle>{t("somethingWentWrong")}</GrimoirePageTitle>
      {/* messaggio tradotto dal codice dell'errore, o generico */}
      <GrimoireAlert error={error} />
      <GrimoireButton onClick={reset}>{t("retry")}</GrimoireButton>
    </GrimoirePage>
  );
}
