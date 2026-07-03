export type ToastType = 'success' | 'error' | 'memory';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: Toast) => void;
const toastListeners: ToastListener[] = [];

export function subscribeToToasts(callback: ToastListener) {
  toastListeners.push(callback);
  return () => {
    const index = toastListeners.indexOf(callback);
    if (index !== -1) {
      toastListeners.splice(index, 1);
    }
  };
}

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}
