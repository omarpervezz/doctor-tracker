"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const width =
    size === "xl" ? "max-w-6xl" : size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={() => onCloseRef.current()}
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`card max-h-[92vh] w-full ${width} overflow-auto p-5`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>

          <button
            ref={closeButtonRef}
            onClick={() => onCloseRef.current()}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            type="button"
          >
            <X />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
