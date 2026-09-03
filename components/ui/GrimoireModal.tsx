"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

type Props = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "lg" | "xl";
};

export default function GrimoireModal({ show, onClose, title, children, size }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

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
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ overflow: "hidden" }}>
        <div
          className={`modal-dialog modal-dialog-centered${size ? ` modal-${size}` : ""}`}
          role="document"
        >
          <div
            className={`modal-content${dark ? " g-dark" : ""}`}
            style={{
              backgroundColor: "var(--g-card-bg)",
              borderColor: "var(--g-card-border)",
              color: "var(--g-text)",
            }}
          >
            <div className="modal-header" style={{ borderColor: "var(--g-card-border)" }}>
              <h5 className="modal-title" style={{ color: "var(--g-text)" }}>
                {title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Chiudi" />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
