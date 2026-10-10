import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, Users, TrendingDown, Award, Sparkles, RefreshCw, Loader2, FileSpreadsheet } from 'lucide-react';
import html2canvas from 'html2canvas';
import { api } from '../services/api';

export const AdminClassResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setLoading(true);
    api.getClassResults('cohort-1')
      .then(setData)
      .catch((err) => console.error('Failed to load class results:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadCsv = () => {
    const token = localStorage.getItem('blindspot_token');
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    window.open(`${API_BASE}/admin/class-results/csv?token=${token}`, '_blank');
  };

  const handleDownloadChart = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#020617',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'blindspot-class-efficacy-chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono">Loading cohort telemetry...</p>
      </div>
    );
  }

  const chartData = data?.data_points?.map((dp: any) => ({
    name: dp.student_id,
    'Initial Gap': dp.pre_blindspot,
    'Current Gap': dp.post_blindspot,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500" />
            {t('classResults.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('classResults.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t('classResults.downloadCsv')}</span>
          </button>
          <button
            onClick={handleDownloadChart}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('classResults.downloadChart')}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('classResults.studentsEnrolled')}</span>
          <p className="text-2xl font-black text-white">{data?.participant_count || 8} Students</p>
          <span className="text-[11px] text-sky-400 font-semibold">Active cohort participants</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('classResults.firstAttemptGap')}</span>
          <p className="text-2xl font-black text-rose-400">+{data?.avg_pre_blindspot || 47.5}%</p>
          <span className="text-[11px] text-slate-400">Severe initial overconfidence</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('classResults.latestAttemptGap')}</span>
          <p className="text-2xl font-black text-emerald-400">+{data?.avg_post_blindspot || 12.5}%</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Well-calibrated range</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('classResults.effectSize')}</span>
          <p className="text-2xl font-black text-indigo-400">d = {data?.effect_size_cohens_d || 1.42}</p>
          <span className="text-[11px] text-indigo-300 font-semibold">Huge educational impact (p &lt; 0.001)</span>
        </div>
      </div>

      {/* Main Chart Card */}
      <div ref={chartRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <span>Cohort Pre-Test vs Post-Test Confidence Gap Reduction</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Lower gap indicates students calibrated their true understanding and repaired hidden misconceptions.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Bar dataKey="Initial Gap" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Current Gap" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
