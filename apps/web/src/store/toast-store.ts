import { create } from "zustand";

export type Toast = {
  id: string;
  message: string;
  tone: "success" | "error";
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "error") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toastError(message: string) {
  useToastStore.getState().push(message, "error");
}

export function toastSuccess(message: string) {
  useToastStore.getState().push(message, "success");
}
