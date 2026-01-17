"use client";

import { useEffect, useState, useRef } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
}

const icons = {
  error: <AlertCircle className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

const styles = {
  error: "border-red-500/20 bg-red-500/5 text-red-500",
  success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
  info: "border-blue-500/20 bg-blue-500/5 text-blue-500",
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-500",
};

const progressStyles = {
  error: "bg-red-500",
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

export function Toast({
  id,
  message,
  type,
  duration = 4000,
  action,
  onDismiss,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      if (isExiting) return;

      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percentage = (remaining / duration) * 100;
      setProgress(percentage);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        handleDismiss();
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [duration, isExiting]);

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all duration-300 ease-out transform
        ${styles[type]}
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="shrink-0">{icons[type]}</div>
      
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium leading-none text-foreground">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </p>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          {message}
        </p>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              handleDismiss();
            }}
            className="mt-2 text-xs font-medium px-2 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-foreground transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 hover:bg-surface-elevated/50 focus:outline-none focus:ring-2 focus:ring-border text-muted"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-surface-elevated/20">
        <div
          className={`h-full ${progressStyles[type]} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
