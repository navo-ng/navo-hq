"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (toast: { title: string; type: ToastType }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950",
    icon: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
};

function ToastIcon({ type }: { type: ToastType }) {
  const style = TYPE_STYLES[type].icon;
  switch (type) {
    case "success":
      return <CheckCircle size={18} className={style} />;
    case "error":
      return <XCircle size={18} className={style} />;
    case "info":
      return <Info size={18} className={style} />;
  }
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  const styles = TYPE_STYLES[toast.type];

  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 ${styles.bg} ${styles.border} ${
        toast.exiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <ToastIcon type={toast.type} />
      </div>
      <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
        {toast.title}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    ({ title, type }: { title: string; type: ToastType }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, title, type, exiting: false }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
