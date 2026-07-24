import { createContext } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "danger";
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

