"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
};

export default function GrimoirePageTitle({ children, showBack = false }: Props) {
  const t = useTranslations("ui");
  const dark = useAppSelector((s) => s.theme.value === "dark");
  const router = useRouter();

  return (
    <div className="d-flex align-items-center gap-3 mb-4">
      {showBack && (
        <button
          onClick={() => router.back()}
          className={`btn btn-outline-secondary btn-sm${dark ? " g-dark" : ""}`}
          aria-label={t("back")}
        >
          ←
        </button>
      )}
      <h2
        className={`mb-0${dark ? " g-dark" : ""}`}
        style={{ color: "var(--g-page-title)", fontWeight: 700 }}
      >
        {children}
      </h2>
    </div>
  );
}
