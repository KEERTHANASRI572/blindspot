import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { CalibrationCurvePoint } from '../types';
import { Activity } from 'lucide-react';

interface CalibrationChartProps {
  data: CalibrationCurvePoint[];
  brierScore: number;
  overconfidenceRate: number;
}

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  data,
  brierScore,
  overconfidenceRate,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Calibration Reliability Curve</h4>
            <p className="text-xs text-slate-400">Subjective Confidence Bins vs. Empirical Accuracy</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            Brier Score: <strong className="text-sky-400">{brierScore.toFixed(3)}</strong>
          </span>
        </div>
      </div>

      {/* Recharts Chart */}
      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            {/* 45 Degree Ideal Calibration Diagonal */}
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal Perfect Calibration"
              stroke="#64748b"
              strokeDasharray="5 5"
              dot={false}
            />
            {/* Student's Actual Line */}
            <Line
              type="monotone"
              dataKey="avg_actual"
              name="Your Actual Accuracy (%)"
              stroke="#38bdf8"
              strokeWidth={3}
              activeDot={{ r: 6, fill: '#38bdf8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Overconfidence Rate</span>
          <span className="text-lg font-black text-rose-400 font-mono">{overconfidenceRate}%</span>
          <p className="text-[10px] text-slate-500 mt-0.5">Attempts where confidence exceeded reality by &gt;15%</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Brier Scoring Metric</span>
          <span className="text-lg font-black text-sky-400 font-mono">{brierScore.toFixed(4)}</span>
          <p className="text-[10px] text-slate-500 mt-0.5">Mean squared probability error (0.00 = perfect)</p>
        </div>
      </div>
    </div>
  );
};
