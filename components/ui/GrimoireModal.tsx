"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

type Props = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "lg" | "xl";
  // Sotto i 992px la modale occupa tutto lo schermo (modal-fullscreen-lg-down di Bootstrap)
  fullscreenOnMobile?: boolean;
  // Mentre i dati arrivano: barra grigia che pulsa al posto del titolo
  titleSkeleton?: boolean;
  // Sopra le altre modali (es. una conferma aperta da dentro un'altra modale)
  onTop?: boolean;
};

export default function GrimoireModal({ show, onClose, title, children, footer, size, fullscreenOnMobile = false, titleSkeleton = false, onTop = false }: Props) {
  const t = useTranslations("ui");

  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (show) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={onTop ? { zIndex: 1062 } : undefined} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ overflowY: "auto", zIndex: onTop ? 1063 : undefined }}>
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable${size ? ` modal-${size}` : ""}${fullscreenOnMobile ? " modal-fullscreen-lg-down" : ""}`}
          role="document"
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--g-card-bg)",
              borderColor: "var(--g-card-border)",
              color: "var(--g-text)",
            }}
          >
            <div className="modal-header" style={{ borderColor: "var(--g-card-border)" }}>
              <h5 className="modal-title placeholder-glow flex-grow-1" style={{ color: "var(--g-text)" }}>
                {titleSkeleton ? <span className="placeholder col-6 rounded" /> : title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label={t("close")} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && (
              <div className="modal-footer" style={{ borderColor: "var(--g-card-border)" }}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
