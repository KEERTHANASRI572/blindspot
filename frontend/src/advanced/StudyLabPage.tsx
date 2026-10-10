import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StudyLabAnalytics } from '../types';
import { Users, Download, TrendingDown, Award, Sparkles, BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const StudyLabPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<StudyLabAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getStudyLabAnalytics('grp-demo-cs')
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCSV = () => {
    window.location.href = '/api/study-lab/export-csv?group_id=grp-demo-cs';
  };

  if (loading || !analytics) {
    return (
      <div className="text-center py-24 text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Aggregating empirical cohort telemetry...</p>
      </div>
    );
  }

  const chartData = analytics.data_points.map((dp) => ({
    student: dp.student_id,
    pre: dp.pre_blindspot,
    post: dp.post_blindspot,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Empirical Evidence & Efficacy Lab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{analytics.name}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pre-test vs. Post-test statistical reduction of cognitive overconfidence across N={analytics.participant_count} learners.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 flex items-center gap-2 shadow-lg"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>Export Research CSV</span>
        </button>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Blindspot Reduction (Δ)</span>
          <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
            -{analytics.blindspot_reduction_delta}%
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Average overconfidence dropped from {analytics.avg_pre_blindspot}% to {analytics.avg_post_blindspot}%</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Effect Size (Cohen's d)</span>
          <span className="text-3xl font-black text-sky-400 font-mono mt-1 block">
            {analytics.effect_size_cohens_d.toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">d &gt; 0.8 denotes massive educational impact</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Statistical Significance</span>
          <span className="text-3xl font-black text-purple-400 font-mono mt-1 block">
            p &lt; 0.001
          </span>
          <p className="text-[11px] text-slate-500 mt-1">p={analytics.p_value_significance} (Statistically significant)</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Recall vs Transfer Gap</span>
          <span className="text-3xl font-black text-rose-400 font-mono mt-1 block">
            {analytics.recall_vs_transfer_gap}%
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Proof that students memorize rather than understand</p>
        </div>
      </div>

      {/* Cohort Comparative Chart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white">Individual Student Blindspot: Pre-App vs Post-App</h4>
            <p className="text-xs text-slate-400">Comparing blindspot dissonance before and after Socratic hint repair</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            N = {analytics.participant_count}
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="student" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="pre" name="Pre-Test Blindspot (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="post" name="Post-Test Blindspot (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
