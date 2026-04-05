'use client';

import { useState, useEffect, useCallback } from 'react';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListener: ((toast: ToastData) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const toast: ToastData = { id: crypto.randomUUID(), message, type };
  toastListener?.(toast);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3000);
  }, []);

  useEffect(() => {
    toastListener = addToast;
    return () => {
      toastListener = null;
    };
  }, [addToast]);

  const colorMap = {
    success: 'border-l-[#00C650]',
    error: 'border-l-[#FF4444]',
    info: 'border-l-[#3B82F6]',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-[#080F1E] border border-[#1A2235] ${colorMap[t.type]} border-l-4 rounded-md px-4 py-3 text-sm text-slate-200 shadow-lg animate-in slide-in-from-right`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
