import { X } from "lucide-react";
import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "./button";
import { ToastContext, type ToastMessage } from "./toast-context";
import { cn } from "@/utils";

export interface ToastProviderProps {
  children: ReactNode;
}

const styles = {
  info: "border-primary/20",
  success: "border-success/20",
  warning: "border-warning/20",
  danger: "border-danger/20"
} as const;

export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const removeToast = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => setToasts((current) => [...current, { ...toast, id: crypto.randomUUID() }]), []);
  const value = useMemo(() => ({ toasts, addToast, removeToast }), [addToast, removeToast, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps): ReactElement {
  return (
    <div aria-live="polite" aria-relevant="additions" className="fixed bottom-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("rounded-xl border bg-surface p-4 text-foreground shadow-lg", styles[toast.variant ?? "info"])}>
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description ? <p className="text-sm text-muted-foreground">{toast.description}</p> : null}
            </div>
            <Button aria-label="Dismiss notification" size="icon" variant="ghost" onClick={() => onDismiss(toast.id)}><X aria-hidden="true" className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

