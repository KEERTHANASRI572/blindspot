import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MisconceptionRadarPoint } from '../types';
import { Fingerprint, Info } from 'lucide-react';

interface MisconceptionRadarProps {
  data: MisconceptionRadarPoint[];
  synthesisText: string;
  topStrength: string;
  primaryBlindspot: string;
}

export const MisconceptionRadar: React.FC<MisconceptionRadarProps> = ({
  data,
  synthesisText,
  topStrength,
  primaryBlindspot,
}) => {
  // Format data for radar
  const formattedData = data.map((d) => ({
    category: d.error_type.length > 22 ? d.error_type.slice(0, 20) + '...' : d.error_type,
    severity: d.severity_avg || d.count,
    count: d.count,
  }));

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Misconception Fingerprint Profile</h4>
            <p className="text-xs text-slate-400">Personalized cognitive error patterns across topics</p>
          </div>
        </div>
      </div>

      {/* Radar Graphic */}
      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={formattedData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#475569" tick={false} />
            <Radar
              name="Error Severity"
              dataKey="severity"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.35}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Synthesis & Diagnostic Cards */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed">
          <span className="font-bold text-sky-400 block mb-1">AI Cognitive Synthesis:</span>
          {synthesisText}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-300">
            <span className="font-bold block text-emerald-400">Primary Strength:</span>
            {topStrength}
          </div>
          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/30 text-rose-300">
            <span className="font-bold block text-rose-400">Core Blindspot:</span>
            {primaryBlindspot}
          </div>
        </div>
      </div>
    </div>
  );
};
