import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, BookOpen, UserCheck, LogOut, Shield, Compass, BarChart2, Globe, LogIn } from 'lucide-react';
import { User, Language } from '../types';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenAdminLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  language,
  onLanguageChange,
  onOpenAuth,
  onOpenAdminLogin,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();

  const handleLangSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    i18n.changeLanguage(newLang);
    onLanguageChange(newLang);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Home Click */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentPage(isAdmin ? 'admin-dashboard' : 'home')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                {t('app.title')}
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    ADMIN
                  </span>
                )}
              </span>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-sans hidden sm:block">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          {/* Nav Items (Max 4 for User, clear and friendly) */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage === 'home'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.home')}
                </button>

                <button
                  onClick={() => setCurrentPage('courses')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage === 'courses' || currentPage.startsWith('course-')
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.myCourses')}
                </button>

                {currentUser && (
                  <button
                    onClick={() => setCurrentPage('progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      currentPage === 'progress'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t('nav.myProgress')}
                  </button>
                )}
              </>
            ) : (
              /* Admin Navigation */
              <>
                <button
                  onClick={() => setCurrentPage('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage === 'admin-dashboard'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.dashboard')}
                </button>

                <button
                  onClick={() => setCurrentPage('admin-courses')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage.startsWith('admin-courses') || currentPage.startsWith('admin-course-')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.courses')}
                </button>

                <button
                  onClick={() => setCurrentPage('admin-users')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage === 'admin-users'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.users')}
                </button>

                <button
                  onClick={() => setCurrentPage('admin-class-results')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentPage === 'admin-class-results'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('nav.classResults')}
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Language Dropdown + Auth */}
          <div className="flex items-center space-x-3">
            {/* Language Selector Dropdown */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
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

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-300 hidden md:inline">
                  {currentUser.name}
                </span>
                <button
                  onClick={onLogout}
                  title={t('nav.logout')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.signIn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
