"use client";

import { useAppSelector } from "@/store/hooks";

type Variant = "danger" | "success" | "warning" | "info";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export default function GrimoireAlert({ children, variant = "danger" }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const style =
    variant === "danger"
      ? {
          backgroundColor: "var(--g-alert-danger-bg)",
          borderColor: "var(--g-alert-danger-border)",
          color: "var(--g-alert-danger-text)",
        }
      : undefined;

  return (
    <div
      className={`alert alert-${variant} py-2${dark ? " g-dark" : ""}`}
      role="alert"
      style={style}
    >
      {children}
    </div>
  );
}
