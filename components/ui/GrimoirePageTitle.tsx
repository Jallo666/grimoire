"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
  action?: React.ReactNode;
};

export default function GrimoirePageTitle({ children, showBack = false, action }: Props) {
  const t = useTranslations("ui");
  const router = useRouter();

  const titleBlock = (
    <div className="d-flex align-items-center gap-3">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="btn btn-outline-secondary btn-sm"
          aria-label={t("back")}
        >
          ←
        </button>
      )}
      <h2
        className="mb-0"
        style={{ color: "var(--g-page-title)", fontWeight: 700 }}
      >
        {children}
      </h2>
    </div>
  );

  if (action !== undefined) {
    // Titolo a sinistra e bottoni a destra, sempre sulla stessa riga.
    // Su mobile i bottoni del titolo usano mobileIcon (solo icona) per stare accanto al titolo;
    // se lo spazio non basta va a capo il titolo, non i bottoni.
    return (
      <div className="d-flex justify-content-between align-items-center gap-2 gap-lg-0 mb-4">
        <div style={{ minWidth: 0 }}>{titleBlock}</div>
        <div className="flex-shrink-0">{action}</div>
      </div>
    );
  }

  return <div className="mb-4">{titleBlock}</div>;
}
