import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, ArrowRight, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { CourseListItem } from '../types';

interface CoursesPageProps {
  courses: CourseListItem[];
  onSelectCourse: (courseId: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ courses, onSelectCourse }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('courses.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('courses.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            {t('courses.emptyState')}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-3xl p-6 transition-all shadow-lg hover:shadow-sky-500/10 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {course.difficulty}
                    </span>
                    {course.is_new && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        {t('courses.newBadge')}
                      </span>
                    )}
                    {course.is_updated && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold">
                        {t('courses.updatedBadge')}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {course.question_count} {t('courses.questionsCount')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug group-hover:text-sky-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-sky-400">
                <span>{t('courses.startPractice')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
