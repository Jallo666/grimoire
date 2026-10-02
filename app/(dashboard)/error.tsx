"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";

type ApolloLike = Error & { graphQLErrors?: { extensions?: { code?: string } }[] };

export default function DashboardError({
  error,
  reset,
}: {
  error: ApolloLike & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("errors");
  const code = error.graphQLErrors?.[0]?.extensions?.code;

  useEffect(() => {
    if (code === "UNAUTHENTICATED") router.push("/login");
  }, [code, router]);

  if (code === "UNAUTHENTICATED") return null;

  return (
    <GrimoirePage>
      <GrimoirePageTitle showBack>
        {code === "FORBIDDEN" ? t("accessDenied") : t("error")}
      </GrimoirePageTitle>
      <p style={{ color: "var(--g-text-muted)" }}>
        {code === "FORBIDDEN" ? t("forbiddenDescription") : (error.message ?? t("unexpectedError"))}
      </p>
      {code !== "FORBIDDEN" && (
        <GrimoireButton variant="outline-secondary" onClick={reset}>
          {t("retry")}
        </GrimoireButton>
      )}
    </GrimoirePage>
  );
}
