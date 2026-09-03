"use client";

import { useAppSelector } from "@/store/hooks";
import GrimoireIcon from "./GrimoireIcon";

type Variant = "primary" | "outline-light" | "outline-secondary" | "danger";
type Size = "sm" | "lg";

type Props = {
  children?: React.ReactNode;
  icon?: string;
  tooltip?: string;
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
  icon,
  tooltip,
  variant = "primary",
  size,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = "button",
  onClick,
}: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const iconOnly = !!icon && !children;

  const classes = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    fullWidth ? "w-100" : "",
    dark ? "g-dark" : "",
    iconOnly ? "d-inline-flex align-items-center justify-content-center" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      style={iconOnly ? { width: "2rem", height: "2rem", padding: 0 } : undefined}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      ) : icon ? (
        <GrimoireIcon name={icon} size={14} />
      ) : null}
      {children}
    </button>
  );
}
