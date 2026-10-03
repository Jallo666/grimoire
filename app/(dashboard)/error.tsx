"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { errorExtensions } from "@/lib/errorReason";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireButton from "@/components/ui/GrimoireButton";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("errors");
  // code generico dell'errore del server (UNAUTHENTICATED, FORBIDDEN, …)
  const code = errorExtensions(error)?.code;

  // Sessione scaduta: si torna al login
  useEffect(() => {
    if (code === "UNAUTHENTICATED") router.push("/login");
  }, [code, router]);

  if (code === "UNAUTHENTICATED") return null;

  return (
    <GrimoirePage>
      <GrimoirePageTitle showBack>
        {code === "FORBIDDEN" ? t("accessDenied") : t("error")}
      </GrimoirePageTitle>
      {/* messaggio tradotto dal codice dell'errore, o generico */}
      <GrimoireAlert error={error} />
      {code !== "FORBIDDEN" && (
        <GrimoireButton variant="outline-secondary" onClick={reset}>
          {t("retry")}
        </GrimoireButton>
      )}
    </GrimoirePage>
  );
}
