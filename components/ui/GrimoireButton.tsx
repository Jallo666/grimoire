"use client";

import { useAppSelector } from "@/store/hooks";

type Variant = "primary" | "outline-light" | "outline-secondary" | "danger";
type Size = "sm" | "lg";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export default function GrimoireButton({
  children,
  variant = "primary",
  size,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = "button",
  onClick,
}: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const classes = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    fullWidth ? "w-100" : "",
    dark ? "g-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
