"use client";

import GrimoireButton from "@/components/ui/GrimoireButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container py-5 text-center">
      <h2 style={{ color: "var(--g-text)" }}>Qualcosa è andato storto</h2>
      <p style={{ color: "var(--g-text-muted)" }}>{error.message}</p>
      <GrimoireButton onClick={reset}>Riprova</GrimoireButton>
    </main>
  );
}
