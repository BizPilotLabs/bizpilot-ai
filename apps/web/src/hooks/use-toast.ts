import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "@/components/ui/toast-context";

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

