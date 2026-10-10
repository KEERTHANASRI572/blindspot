import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target, GraduationCap, Shield, Eye, EyeOff, ArrowRight,
  ArrowLeft, CheckCircle2, AlertCircle, Loader2, Sparkles, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { User, Language } from '../types';

interface WelcomePageProps {
  onLoginSuccess: (user: User) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onLoginSuccess,
  language,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<'none' | 'learner' | 'admin'>('none');
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLangSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    i18n.changeLanguage(newLang);
    onLanguageChange(newLang);
  };

  const handleLearnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authTab === 'signup') {
      if (password.length < 8) {
        setErrorMessage(t('auth.passwordPlaceholder'));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('welcome.passwordsDoNotMatch'));
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authTab === 'signup') {
        const res = await api.signup({ name, email, password, language });
        localStorage.setItem('blindspot_token', res.token);
        onLoginSuccess(res.user);
      } else {
        const res = await api.login({ email, password });
        localStorage.setItem('blindspot_token', res.token);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('auth.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.adminLogin(adminPassword);
      localStorage.setItem('blindspot_token', res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect admin password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Bar with Language Switcher */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            {t('app.title')}
          </span>
        </div>

        {/* Global Language Selector on Welcome Screen */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
          <Globe className="w-4 h-4 text-sky-400 mr-2" />
          <select
            value={language}
            onChange={handleLangSelect}
            className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
            <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
          </select>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {selectedRole === 'none' && (
          <div className="w-full space-y-10 text-center animate-fadeIn">
            {/* Tagline */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-sky-500/30 text-sky-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('app.subtitle')}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {t('welcome.headline')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {t('welcome.subheadline')}
              </p>
            </div>

            {/* 2 Big Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4 text-left">
              {/* Learner Card */}
              <button
                onClick={() => {
                  setSelectedRole('learner');
                  setErrorMessage('');
                }}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-3xl p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                    {t('welcome.learnerCardTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t('welcome.learnerCardDesc')}
                  </p>
                </div>
                <div className="mt-8 flex items-center text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
                  <span>Continue as Learner</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </div>
              </button>

              {/* Admin Card */}
              <button
                onClick={() => {
                  setSelectedRole('admin');
                  setErrorMessage('');
                }}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {t('welcome.adminCardTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t('welcome.adminCardDesc')}
                  </p>
                </div>
                <div className="mt-8 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Continue as Admin</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Learner Auth Form Screen */}
        {selectedRole === 'learner' && (
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn space-y-6">
            <button
              onClick={() => {
                setSelectedRole('none');
                setErrorMessage('');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('welcome.backToRoles')}</span>
            </button>

            {/* Tab switch */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'signin'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('welcome.signInTab')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'signup'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('welcome.signUpTab')}
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLearnerSubmit} className="space-y-4">
              {authTab === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t('auth.nameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.namePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t('auth.emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authTab === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t('welcome.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('welcome.confirmPasswordPlaceholder')}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{authTab === 'signin' ? t('auth.signInBtn') : t('auth.signUpBtn')}</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Admin Auth Form Screen */}
        {selectedRole === 'admin' && (
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn space-y-6">
            <button
              onClick={() => {
                setSelectedRole('none');
                setErrorMessage('');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('welcome.backToRoles')}</span>
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                {t('auth.adminLoginTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                Enter your master admin password to access course authoring & telemetry
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t('auth.adminPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={t('auth.adminPasswordPlaceholder')}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{t('auth.adminLoginBtn')}</span>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-600">
        <p>BLINDSPOT • Built for ForgeHacks 2026 AI + Education Track</p>
      </footer>
    </div>
  );
};
