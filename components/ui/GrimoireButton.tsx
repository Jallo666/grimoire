"use client";

import GrimoireIcon from "./GrimoireIcon";

export type Variant = "primary" | "outline-light" | "outline-secondary" | "danger";
type Size = "sm" | "lg";

type Props = {
  children?: React.ReactNode;
  icon?: string;
  // Sotto i 992px mostra solo questa icona al posto del testo (da 992px in su: solo il testo, come sempre)
  mobileIcon?: string;
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
  mobileIcon,
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

  // Con mobileIcon il testo su mobile non si vede: resta come etichetta per i lettori di schermo
  const ariaLabel = tooltip ?? (mobileIcon && typeof children === "string" ? children : undefined);

  return (
    <button
      type={type}
      form={form}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      title={tooltip}
      aria-label={ariaLabel}
      style={iconOnly ? { width: "2rem", height: "2rem", padding: 0 } : undefined}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      ) : icon ? (
        <GrimoireIcon name={icon} size={14} />
      ) : null}
      {mobileIcon ? (
        <>
          <span className="d-lg-none"><GrimoireIcon name={mobileIcon} size={16} /></span>
          <span className="d-none d-lg-inline">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
