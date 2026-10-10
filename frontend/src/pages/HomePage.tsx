import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Target, Sparkles, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { User, CourseListItem } from '../types';

interface HomePageProps {
  currentUser: User | null;
  courses: CourseListItem[];
  onNavigate: (page: string) => void;
  onSelectCourse: (courseId: string) => void;
  onOpenAdminLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  courses,
  onNavigate,
  onSelectCourse,
  onOpenAdminLogin,
}) => {
  const { t } = useTranslation();

  const featuredCourse = courses.length > 0 ? courses[0] : null;

  return (
    <div className="space-y-16 py-8">
      {/* Hero Pitch */}
      <section className="text-center max-w-3xl mx-auto px-4 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('app.subtitle')}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {currentUser ? `${t('home.greeting')}, ${currentUser.name}!` : t('home.headline')}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          {t('home.pitch')}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('courses')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-sky-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <span>{t('home.exploreCourses')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Continue where you left off card (if course available) */}
      {featuredCourse && (
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold block mb-1">
                {t('home.continueLearning')}
              </span>
              <h3 className="text-xl font-bold text-white leading-snug">
                {featuredCourse.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-2">
                {featuredCourse.description}
              </p>
            </div>

            <button
              onClick={() => onSelectCourse(featuredCourse.id)}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
            >
              <span>{t('home.startCourse')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* 3 Simple Steps */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t('home.threeStepTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="text-base font-bold text-white">{t('home.step1Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t('home.step1Desc')}</p>
          </div>

          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="text-base font-bold text-white">{t('home.step2Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t('home.step2Desc')}</p>
          </div>

          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="text-base font-bold text-white">{t('home.step3Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t('home.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* Footer Admin Link */}
      <footer className="text-center pt-8 text-xs text-slate-500">
        <button
          onClick={onOpenAdminLogin}
          className="text-slate-500 hover:text-slate-300 underline underline-offset-4 text-xs font-mono"
        >
          {t('nav.adminLogin')}
        </button>
      </footer>
    </div>
  );
};
