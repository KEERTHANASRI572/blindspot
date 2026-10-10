import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { BarChart2, CheckCircle, TrendingDown, AlertCircle, Download, Award, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { UserProgress } from '../types';

export const ProgressPage: React.FC = () => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getUserProgress()
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'my-blindspot-progress-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Loading your learning progress...</p>
      </div>
    );
  }

  if (!progress || progress.total_attempts === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900 rounded-3xl p-12 border border-slate-800 space-y-4">
          <BarChart2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">{t('progress.title')}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{t('progress.emptyState')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          {t('progress.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('progress.subtitle')}
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {t('progress.averageGap')}
          </span>
          <div className="text-3xl font-black text-sky-400 font-mono">
            {Math.round(progress.average_gap)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Goal is closer to 0 (well calibrated)</p>
        </div>

        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {t('progress.coursesCompleted')}
          </span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {progress.courses_completed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Mastered with score &gt;= 70%</p>
        </div>

        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {t('progress.totalAttempts')}
          </span>
          <div className="text-3xl font-black text-purple-400 font-mono">
            {progress.total_attempts}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Real-life practice scenarios solved</p>
        </div>
      </div>

      {/* Line Chart: Confidence Gap Trend */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold text-white">{t('progress.gapTrendTitle')}</h4>
          <p className="text-xs text-slate-400">{t('progress.gapTrendDesc')}</p>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progress.history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="gap"
                name="Confidence Gap"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ fill: '#38bdf8', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagnostic Insights & Downloadable Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Printable Card Area */}
        <div
          ref={cardRef}
          className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black text-white">BLINDSPOT LEARNER PROFILE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400">
              Avg Gap: {Math.round(progress.average_gap)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              {t('progress.commonMistakeTitle')}
            </span>
            <p className="text-xs text-slate-300 font-medium">
              {progress.top_mistake}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              {t('progress.topStrengthTitle')}
            </span>
            <p className="text-xs text-slate-300 font-medium">
              {progress.top_strength}
            </p>
          </div>

          <button
            onClick={handleDownloadCard}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>{t('progress.downloadCard')} (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
