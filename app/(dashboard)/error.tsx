"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const code = error.graphQLErrors?.[0]?.extensions?.code;

  useEffect(() => {
    if (code === "UNAUTHENTICATED") router.push("/login");
  }, [code, router]);

  if (code === "UNAUTHENTICATED") return null;

  return (
    <main className="container py-5">
      <GrimoirePageTitle showBack>
        {code === "FORBIDDEN" ? "Accesso negato" : "Errore"}
      </GrimoirePageTitle>
      <p style={{ color: "var(--g-text-muted)" }}>
        {code === "FORBIDDEN"
          ? "Non sei membro di questa campagna."
          : (error.message ?? "Si è verificato un errore imprevisto.")}
      </p>
      {code !== "FORBIDDEN" && (
        <GrimoireButton variant="outline-secondary" onClick={reset}>
          Riprova
        </GrimoireButton>
      )}
    </main>
  );
}
