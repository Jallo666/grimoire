"use client";

import GrimoireIcon from "./GrimoireIcon";

export type Variant = "primary" | "outline-light" | "outline-secondary" | "danger";
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
  form?: string;
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
  form,
  onClick,
}: Props) {
  const iconOnly = !!icon && !children;

  const classes = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    fullWidth ? "w-100" : "",
    iconOnly ? "d-inline-flex align-items-center justify-content-center" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      form={form}
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
