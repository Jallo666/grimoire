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
    // Tablet e telefono: bottoni sotto il titolo (flex-column, 16px di spazio).
    // Desktop da 992px: titolo a sinistra e bottoni a destra sulla stessa riga, come prima.
    return (
      <div className="d-flex flex-column gap-3 flex-lg-row justify-content-lg-between align-items-lg-center gap-lg-0 mb-4">
        {titleBlock}
        <div>{action}</div>
      </div>
    );
  }

  return <div className="mb-4">{titleBlock}</div>;
}
