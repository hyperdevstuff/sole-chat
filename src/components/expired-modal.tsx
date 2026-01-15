"use client";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "../hooks/use-focus-trap";

interface ExpiredModalProps {
  isOpen: boolean;
  onExport: () => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export function ExpiredModal({
  isOpen,
  onExport,
  onCreateNew,
  onClose,
}: ExpiredModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-100 mb-2">
          Room Expired
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          This room has expired. Export your chat or start fresh.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onExport}
            aria-label="Export chat history"
            className="w-full py-2.5 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            Export Chat
          </button>
          <button
            onClick={onCreateNew}
            aria-label="Create a new chat room"
            className="w-full py-2.5 px-4 bg-neutral-700/50 hover:bg-neutral-700 border border-neutral-600/40 text-neutral-300 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
}
