/**
 * @page Dialog
 * @description Shell reutilizavel para dialogs centrais do sistema.
 * @path src/components/Dialog.tsx
 */

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  contentClassName?: string;
  closeDisabled?: boolean;
};

export default function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  widthClassName = "max-w-2xl",
  contentClassName,
  closeDisabled = false,
}: DialogProps) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const tratarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener("keydown", tratarEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", tratarEscape);
    };
  }, [open, onClose, closeDisabled]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div
        className="absolute inset-0 bg-text-body/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!closeDisabled) {
            onClose();
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-2xl ${widthClassName}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-default px-6 py-5">
          <div>
            <h3 id="dialog-title" className="text-lg font-bold text-text-body">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            ) : null}
          </div>

          <button
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-lg px-2 py-1 text-sm text-text-muted transition-colors hover:text-text-body disabled:opacity-50"
          >
            Fechar
          </button>
        </div>

        <div
          className={`overflow-y-auto px-6 py-5 ${contentClassName ?? ""}`.trim()}
        >
          {children}
        </div>

        {footer ? (
          <div className="border-t border-border-default bg-bg-default px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
