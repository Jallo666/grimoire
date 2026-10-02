"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

type Props = {
  show: boolean;
  onClose: () => void;
  title: string;
  // Facoltativi: riga piccola sotto il titolo (es. "Ciao, Nome") e logo a sinistra del titolo
  subtitle?: string;
  logo?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

// Menu laterale che si apre da sinistra sopra la pagina.
// Ha lo stesso aspetto della navbar (sfondo primario, testo bianco) in entrambi i temi.
// Si chiude con la ✕, toccando lo sfondo scuro o premendo Esc.
export default function GrimoireSidenav({ show, onClose, title, subtitle, logo, children, footer }: Props) {
  const t = useTranslations("ui");

  // Blocca lo scroll della pagina mentre il menu è aperto
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
      <div className="offcanvas-backdrop fade show" onClick={onClose} />
      <div
        className="offcanvas offcanvas-start show bg-primary text-white"
        data-bs-theme="dark"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: "280px", maxWidth: "85vw" }}
      >
        <div className="offcanvas-header border-bottom border-light border-opacity-25">
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            {logo}
            <div style={{ minWidth: 0 }}>
              <h5 className="offcanvas-title mb-0">{title}</h5>
              {subtitle && <div className="small opacity-75 text-truncate">{subtitle}</div>}
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label={t("close")} />
        </div>
        <div className="offcanvas-body d-flex flex-column gap-1">{children}</div>
        {footer && (
          <div className="p-3 border-top border-light border-opacity-25 d-flex flex-column gap-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
