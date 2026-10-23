import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  variant?: 'success' | 'error' | 'neutral';
  undoLabel?: string;
  onUndo?: () => void;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, undo?: { label: string; onUndo: () => void }) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      message,
      variant = 'success',
      undoLabel,
      onUndo,
      duration = 4000,
    }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant, undoLabel, onUndo, duration }]);
    },
    []
  );

  const success = useCallback(
    (message: string, undo?: { label: string; onUndo: () => void }) => {
      showToast({
        message,
        variant: 'success',
        undoLabel: undo?.label,
        onUndo: undo?.onUndo,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string) => {
      showToast({ message, variant: 'error' });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      {/* Toast container - bottom-center */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none max-w-[90vw] w-max safe-bottom"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-control shadow-modal border bg-canvas text-ink text-[14px] font-medium transition-all',
        toast.variant === 'error'
          ? 'border-danger-600/30 bg-danger-50 text-danger-600'
          : 'border-verdant-600/20 bg-canvas text-ink'
      )}
    >
      {toast.variant === 'error' ? (
        <AlertCircle className="w-4 h-4 shrink-0 text-danger-600" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0 text-verdant-700" />
      )}
      <span>{toast.message}</span>

      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="ml-2 font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2 text-xs"
        >
          {toast.undoLabel || 'Undo'}
        </button>
      )}

      <button
        onClick={onDismiss}
        className="ml-1 p-0.5 rounded text-moss hover:text-ink transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
