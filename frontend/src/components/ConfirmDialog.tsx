import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, X, Archive, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  type?: 'delete' | 'cancel' | 'discard';
  confirmMatchText?: string;
  confirmBtnText?: string;
  cancelBtnText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  type = 'cancel',
  confirmMatchText,
  confirmBtnText,
  cancelBtnText,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [typedInput, setTypedInput] = useState('');

  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const matches = confirmMatchText ? typedInput.trim().toLowerCase() === confirmMatchText.trim().toLowerCase() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          isDelete ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {isDelete ? <Trash2 className="w-6 h-6" /> : type === 'cancel' ? <Archive className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        <h3 className="text-lg font-black text-white text-center mb-2">
          {title}
        </h3>
        <p className="text-xs text-slate-400 text-center leading-relaxed mb-6">
          {description}
        </p>

        {isDelete && confirmMatchText && (
          <div className="mb-6 space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              {t('dialogs.typeToConfirm')} <span className="text-rose-400 font-mono">"{confirmMatchText}"</span>
            </label>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={confirmMatchText}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            {cancelBtnText || t('dialogs.close')}
          </button>

          <button
            type="button"
            disabled={!matches}
            onClick={() => {
              onConfirm();
              setTypedInput('');
            }}
            className={`flex-1 py-3 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20'
            }`}
          >
            {confirmBtnText || (isDelete ? t('dialogs.confirmDeleteBtn') : t('dialogs.confirmCancelBtn'))}
          </button>
        </div>
      </div>
    </div>
  );
};
