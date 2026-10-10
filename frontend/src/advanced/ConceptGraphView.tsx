import React, { useState } from 'react';
import { ConceptNode, ConceptEdge } from '../types';
import { Network, Sparkles, ChevronRight, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

interface ConceptGraphViewProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  onSelectConcept: (conceptId: string) => void;
  selectedConceptId?: string;
  onLaunchChallenge: (conceptId: string) => void;
  onLaunchTeach: (conceptId: string) => void;
}

export const ConceptGraphView: React.FC<ConceptGraphViewProps> = ({
  nodes,
  edges,
  onSelectConcept,
  selectedConceptId,
  onLaunchChallenge,
  onLaunchTeach,
}) => {
  const [hoveredNode, setHoveredNode] = useState<ConceptNode | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedConceptId) || nodes[0] || null;

  const getMasteryColor = (p_known: number) => {
    if (p_known >= 0.70) return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', text: 'text-emerald-400', badge: 'Mastered (>=70%)', glow: 'shadow-emerald-500/20' };
    if (p_known >= 0.45) return { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-400', badge: 'Fragile (45-70%)', glow: 'shadow-amber-500/20' };
    return { bg: 'bg-rose-500/15', border: 'border-rose-500/50', text: 'text-rose-400', badge: 'Blindspot Risk (<45%)', glow: 'shadow-rose-500/20' };
  };

  const getEdgeBadge = (type: string) => {
    switch (type) {
      case 'prerequisite_of': return { label: 'prerequisite of', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'causes': return { label: 'causes', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'contrasts_with': return { label: 'contrasts with', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'part_of': return { label: 'part of', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default: return { label: type, color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Interactive Graph Map */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Relational Concept Graph (NetworkX)</h3>
              <p className="text-xs text-slate-400">Mastery updates propagate through prerequisite edges dynamically</p>
            </div>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mastered</span>
            <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Fragile</span>
            <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Blindspot</span>
          </div>
        </div>

        {/* Nodes Grid Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
          {nodes.map((node, index) => {
            const mastery = getMasteryColor(node.p_known);
            const isSelected = selectedConceptId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => onSelectConcept(node.id)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${mastery.bg} ${
                  isSelected
                    ? `${mastery.border} ring-2 ring-sky-500 shadow-lg ${mastery.glow} scale-[1.02]`
                    : 'border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                      C{index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">{node.name}</h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${mastery.border} ${mastery.text}`}>
                    BKT: {Math.round(node.p_known * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{node.summary}</p>

                {/* Micro Progress Bar */}
                <div className="mt-3 w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      node.p_known >= 0.70 ? 'bg-emerald-500' : node.p_known >= 0.45 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(8, node.p_known * 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Typed Edges Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
            <Zap className="w-3.5 h-3.5 text-sky-400" /> Relational Connections:
          </span>
          {edges.map((e, idx) => {
            const fromName = nodes.find((n) => n.id === e.from)?.name || e.from;
            const toName = nodes.find((n) => n.id === e.to)?.name || e.to;
            const badge = getEdgeBadge(e.type);
            return (
              <div
                key={idx}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center space-x-1.5 text-slate-300"
              >
                <span className="font-medium text-slate-200">{fromName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.color}`}>{badge.label}</span>
                <span className="font-medium text-slate-200">{toName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Col: Selected Node Inspector & Action Launchpad */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        {selectedNode ? (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-sky-400">Concept Inspector</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getMasteryColor(selectedNode.p_known).border} ${getMasteryColor(selectedNode.p_known).text}`}>
                {getMasteryColor(selectedNode.p_known).badge}
              </span>
            </div>

            <h3 className="text-lg font-black text-white mt-4">{selectedNode.name}</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{selectedNode.summary}</p>

            {/* BKT Parameters breakdown */}
            <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" /> Bayesian Knowledge Tracing (BKT)
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <div>Probability Known: <span className="text-white font-bold">{Math.round(selectedNode.p_known * 100)}%</span></div>
                <div>Transit Learn (P_T): <span className="text-slate-300">0.20</span></div>
                <div>Slip Rate (P_S): <span className="text-slate-300">0.10</span></div>
                <div>Guess Rate (P_G): <span className="text-slate-300">0.15</span></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2">
                Penalty rule: Failing this node propagates a 10% uncertainty decay to upstream prerequisites.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">Select a concept node to view telemetry</div>
        )}

        {/* Action Launchers */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => selectedNode && onLaunchChallenge(selectedNode.id)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Transfer Scenario</span>
          </button>

          <button
            onClick={() => selectedNode && onLaunchTeach(selectedNode.id)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <span>Teach Confused Student Mode</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
