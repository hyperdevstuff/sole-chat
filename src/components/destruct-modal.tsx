"use client";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "../hooks/use-focus-trap";

interface DestructModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportAndDestroy: () => void;
  onJustDestroy: () => void;
}

export function DestructModal({
  isOpen,
  onClose,
  onExportAndDestroy,
  onJustDestroy,
}: DestructModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-surface-elevated border border-border rounded-lg p-6 w-full max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Destroy Room?
        </h2>
        <p className="text-sm text-muted mb-6">
          This action cannot be undone. All messages will be permanently deleted.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onExportAndDestroy}
            aria-label="Export chat history and destroy room"
            className="w-full py-2.5 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            Export & Destroy
          </button>
          <button
            onClick={onJustDestroy}
            aria-label="Destroy room without exporting"
            className="w-full py-2.5 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            Just Destroy
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label="Cancel and return to chat"
          className="w-full mt-4 py-2 text-muted hover:text-foreground text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
