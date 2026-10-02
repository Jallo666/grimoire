"use client";

type Variant = "secondary" | "primary" | "success" | "danger" | "warning";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export default function GrimoireBadge({ children, variant = "secondary" }: Props) {
  // "secondary" usa i colori del tema (--g-badge-…): grigio nel tema chiaro, ardesia nel tema scuro
  const style =
    variant === "secondary"
      ? { backgroundColor: "var(--g-badge-bg)", color: "var(--g-badge-text)" }
      : undefined;

  return (
    <span
      className={`badge text-bg-${variant}`}
      style={style}
    >
      {children}
    </span>
  );
}
