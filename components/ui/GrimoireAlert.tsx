"use client";

import { useTranslations } from "next-intl";
import { errorReason } from "@/lib/errorReason";

type Variant = "danger" | "success" | "warning" | "info";

type Props = {
  // Testo da mostrare, oppure…
  children?: React.ReactNode;
  // …un errore arrivato dal server: si mostra il testo tradotto del suo codice
  // (gruppo "errors" in messages/*.json), o un messaggio generico se il codice non è noto
  error?: unknown;
  variant?: Variant;
};

export default function GrimoireAlert({ children, error, variant = "danger" }: Props) {
  const t = useTranslations("errors");

  const style =
    variant === "danger"
      ? {
          backgroundColor: "var(--g-alert-danger-bg)",
          borderColor: "var(--g-alert-danger-border)",
          color: "var(--g-alert-danger-text)",
        }
      : undefined;

  let text = children;
  if (typeof error === "string") {
    text = error;
  } else if (error) {
    const reason = errorReason(error);
    text = reason && t.has(reason as Parameters<typeof t>[0]) ? t(reason as Parameters<typeof t>[0]) : t("GENERIC");
  }

  return (
    <div
      className={`alert alert-${variant} py-2`}
      role="alert"
      style={style}
    >
      {text}
    </div>
  );
}
