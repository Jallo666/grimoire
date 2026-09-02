"use client";

import { useAppSelector } from "@/store/hooks";

type Props = {
  children: React.ReactNode;
};

export default function GrimoirePageTitle({ children }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  return (
    <h2
      className={dark ? "g-dark" : undefined}
      style={{ color: "var(--g-page-title)", fontWeight: 700 }}
    >
      {children}
    </h2>
  );
}
