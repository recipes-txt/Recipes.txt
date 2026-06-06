import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage, ToastType } from '../types';
import { generateId } from '../lib/utils';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
  info: <Info size={16} className="text-amber-500 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white',
  error: 'border-red-200 bg-white',
  info: 'border-amber-200 bg-white',
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full animate-slide-in-right ${BG[toast.type]}`}
    >
      {ICONS[toast.type]}
      <p className="flex-1 text-sm font-medium text-stone-800">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-stone-400 hover:text-stone-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
