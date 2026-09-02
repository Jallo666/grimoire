"use client";

import { useAppSelector } from "@/store/hooks";

type Variant = "secondary" | "primary" | "success" | "danger" | "warning";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export default function GrimoireBadge({ children, variant = "secondary" }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const style =
    variant === "secondary" && dark
      ? { backgroundColor: "var(--g-badge-bg)", color: "var(--g-badge-text)" }
      : undefined;

  return (
    <span
      className={`badge text-bg-${variant}${dark ? " g-dark" : ""}`}
      style={style}
    >
      {children}
    </span>
  );
}
