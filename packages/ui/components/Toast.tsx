"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  variant?: ToastVariant;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const variantClasses: Record<ToastVariant, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-brand-primary",
};

const variantIcons: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
};

export function Toast({ variant = "info", message, duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg transition-all duration-200",
        variantClasses[variant],
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
      role="alert"
    >
      <span className="text-base font-bold">{variantIcons[variant]}</span>
      <span>{message}</span>
      <button
        onClick={dismiss}
        className="ml-2 text-white/70 hover:text-white"
        aria-label="Dismiss"
      >
        \u2715
      </button>
    </div>
  );
}

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContainerProps {
  children: ReactNode;
}

let toastCounter = 0;
const listeners: Set<(toast: ToastItem) => void> = new Set();

export function showToast(message: string, variant: ToastVariant = "info") {
  const toast: ToastItem = { id: ++toastCounter, variant, message };
  listeners.forEach((listener) => listener(toast));
}

export function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
