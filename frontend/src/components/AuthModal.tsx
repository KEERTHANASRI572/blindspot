import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { User, Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, language }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (tab === 'signup') {
        if (password.length < 8) {
          throw new Error(t('auth.passwordPlaceholder'));
        }
        const res = await api.signup({ name, email, password, language });
        localStorage.setItem('blindspot_token', res.token);
        onSuccess(res.user, res.token);
        onClose();
      } else {
        const res = await api.login({ email, password });
        localStorage.setItem('blindspot_token', res.token);
        onSuccess(res.user, res.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('auth.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'signin'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('nav.signIn')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'signup'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('nav.signUp')}
          </button>
        </div>

        <h3 className="text-xl font-black text-white text-center mb-1">
          {tab === 'signin' ? t('auth.loginTitle') : t('auth.signupTitle')}
        </h3>
        <p className="text-xs text-slate-400 text-center mb-6">
          {t('app.subtitle')}
        </p>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t('auth.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/20 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tab === 'signin' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{tab === 'signin' ? t('auth.signInBtn') : t('auth.signUpBtn')}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {tab === 'signin' ? (
            <p>
              {t('auth.noAccount')}{' '}
              <button
                onClick={() => { setTab('signup'); setErrorMessage(''); }}
                className="text-sky-400 font-bold hover:underline"
              >
                {t('nav.signUp')}
              </button>
            </p>
          ) : (
            <p>
              {t('auth.alreadyAccount')}{' '}
              <button
                onClick={() => { setTab('signin'); setErrorMessage(''); }}
                className="text-sky-400 font-bold hover:underline"
              >
                {t('nav.signIn')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
