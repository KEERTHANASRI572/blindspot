import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, TrendingDown, PlusCircle, Sparkles, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AdminDashboardStats } from '../types';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate, onShowToast }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    api.getAdminDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      await api.loadSampleCourse();
      onShowToast('Sample course loaded successfully!', 'success');
      loadDashboard();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load sample course', 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
        <p className="text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
            Administrator Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('admin.dashboardTitle')}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
          >
            {loadingSample ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>{t('admin.loadSampleBtn')}</span>
          </button>

          <button
            onClick={() => onNavigate('admin-course-new')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('admin.addCourseBtn')}</span>
          </button>
        </div>
      </div>

      {/* 3 Large Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>{t('admin.totalCourses')}</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-4xl font-black text-white font-mono">{stats?.total_courses || 0}</div>
          <p className="text-[11px] text-slate-500">Draft, published, and archived</p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>{t('admin.totalLearners')}</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-4xl font-black text-white font-mono">{stats?.total_learners || 0}</div>
          <p className="text-[11px] text-slate-500">Registered student accounts</p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>{t('admin.avgGap')}</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-4xl font-black text-amber-400 font-mono">
            {stats?.average_confidence_gap ? Math.round(stats.average_confidence_gap) : 0}
          </div>
          <p className="text-[11px] text-slate-500">Average student confidence gap</p>
        </div>
      </div>

      {/* Recent Activity Audit Log */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{t('admin.recentActivity')}</span>
        </h4>

        {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
          <p className="text-xs text-slate-500 py-6 text-center">No recent activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {stats.recent_activity.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-mono text-[10px] font-bold uppercase">
                    {act.action}
                  </span>
                  <span className="text-slate-300">{act.details}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
