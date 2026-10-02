"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
  action?: React.ReactNode;
};

export default function GrimoirePageTitle({ children, showBack = false, action }: Props) {
  const t = useTranslations("ui");
  const dark = useAppSelector((s) => s.theme.value === "dark");
  const router = useRouter();

  const titleBlock = (
    <div className="d-flex align-items-center gap-3">
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
        className="mb-0"
        style={{ color: "var(--g-page-title)", fontWeight: 700 }}
      >
        {children}
      </h2>
    </div>
  );

  if (action !== undefined) {
    return (
      <div className="d-flex justify-content-between align-items-center mb-4">
        {titleBlock}
        <div>{action}</div>
      </div>
    );
  }

  return <div className="mb-4">{titleBlock}</div>;
}
