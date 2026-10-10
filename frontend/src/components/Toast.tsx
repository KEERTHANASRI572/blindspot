import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, RotateCcw, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
  onUndo?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} undoText={t('toasts.undo')} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void; undoText: string }> = ({
  toast,
  onRemove,
  undoText,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.onUndo ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove, toast.onUndo]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs animate-slideUp ${
        isSuccess
          ? 'bg-slate-900 border-emerald-500/40 text-slate-100'
          : isError
          ? 'bg-slate-900 border-rose-500/40 text-slate-100'
          : 'bg-slate-900 border-sky-500/40 text-slate-100'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        <span className="font-semibold">{toast.text}</span>
      </div>

      <div className="flex items-center space-x-2">
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onRemove(toast.id);
            }}
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{undoText}</span>
          </button>
        )}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
