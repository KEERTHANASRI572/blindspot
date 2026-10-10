import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SpacedQueueData } from '../types';
import { Clock, Zap, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface ReviewsPageProps {
  onSelectConceptToReview: (conceptId: string, topicId: string) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ onSelectConceptToReview }) => {
  const [data, setData] = useState<SpacedQueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDueReviews()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Calculating spaced repetition curve (SM-2)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>SuperMemo-2 (SM-2) Spaced Forgetting Schedule</span>
          </div>
          <h2 className="text-2xl font-black text-white">Due Reviews & Weak Relational Connections</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Concepts and relational edges scheduled for review to prevent memory decay.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            Due Concepts: <strong className="text-amber-400">{data.due_concepts_count}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            Weak Edges: <strong className="text-rose-400">{data.due_connections_count}</strong>
          </span>
        </div>
      </div>

      {/* 2 Grids: Weak Concepts & Weak Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Due Concepts */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Fragile / Overdue Concepts
          </h3>

          <div className="space-y-3">
            {data.due_concepts.map((c) => (
              <div
                key={c.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      BKT: {Math.round(c.p_known * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{c.summary}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-rose-400 font-medium">{c.due_status}</span>
                  <button
                    onClick={() => onSelectConceptToReview(c.id, c.topic_id)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span>Practice Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Due Relational Connections */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" /> Weak Relational Transitions (Edges)
          </h3>

          <div className="space-y-3">
            {data.due_connections.map((e, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-rose-500/40 transition-all space-y-3"
              >
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-200">{e.from_concept}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {e.relationship_type}
                  </span>
                  <span className="font-bold text-slate-200">{e.to_concept}</span>
                </div>
                <p className="text-xs text-slate-400">{e.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
