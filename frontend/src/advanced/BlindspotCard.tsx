import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, AlertOctagon, CheckCircle2, TrendingDown, Sparkles, Share2 } from 'lucide-react';
import { DiagnosisResult } from '../types';

interface BlindspotCardProps {
  diagnosis: DiagnosisResult;
  topicTitle: string;
  conceptName: string;
}

export const BlindspotCard: React.FC<BlindspotCardProps> = ({ diagnosis, topicTitle, conceptName }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `blindspot-diagnostic-${conceptName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export blindspot card:', err);
    }
  };

  const isOverconfident = diagnosis.blindspot_score > 10;
  const isUnderconfident = diagnosis.blindspot_score < -10;
  const isCalibrated = !isOverconfident && !isUnderconfident;

  return (
    <div className="flex flex-col items-center">
      {/* Exportable Graphic Card Canvas */}
      <div
        ref={cardRef}
        className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-slate-800 shadow-2xl relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-30 ${
            isOverconfident ? 'bg-rose-500' : isUnderconfident ? 'bg-indigo-500' : 'bg-emerald-500'
          }`}
        ></div>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-sm">
              🎯
            </span>
            <div>
              <h4 className="text-sm font-black text-white tracking-wide">BLINDSPOT DIAGNOSTIC</h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{topicTitle}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            ForgeHacks 2026
          </span>
        </div>

        {/* Giant Dissonance Stats */}
        <div className="my-6 text-center relative z-10">
          <div className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-1">
            Cognitive Calibration Gap
          </div>
          
          <div className="flex items-center justify-center space-x-4 sm:space-x-8 my-4">
            {/* Confidence Box */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">You Believed</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-400 font-mono">
                {Math.round(diagnosis.confidence_0_100)}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Confidence</span>
            </div>

            <div className="text-xl font-bold text-slate-600">vs</div>

            {/* Reality Box */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">Actual Reality</span>
              <div className={`text-3xl sm:text-4xl font-black font-mono ${
                diagnosis.score_0_100 >= 70 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {Math.round(diagnosis.score_0_100)}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Transfer Score</span>
            </div>
          </div>

          {/* Dissonance Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
            {isOverconfident ? (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">
                  Blindspot Score: +{Math.round(diagnosis.blindspot_score)}% (Dangerous Overconfidence)
                </span>
              </>
            ) : isUnderconfident ? (
              <>
                <TrendingDown className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">
                  Blindspot Score: {Math.round(diagnosis.blindspot_score)}% (Imposter Syndrome)
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  Perfect Calibration: Error &lt; 10%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Diagnosed Misconception & Evidence Section */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 relative z-10 text-left">
          {diagnosis.misconception_name && (
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Diagnosed Flaw:</span>
              <p className="text-xs font-bold text-rose-300">{diagnosis.misconception_name}</p>
            </div>
          )}

          {diagnosis.evidence_quote && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Verbatim Evidence from Your Reasoning:
              </span>
              <p className="text-xs italic text-slate-300 font-mono">
                "{diagnosis.evidence_quote}"
              </p>
            </div>
          )}

          {/* Brier Score Contribution */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Brier Calibration Index:</span>
            <span className="text-sky-400 font-bold">{diagnosis.brier_score_contribution.toFixed(4)} (0.00 = ideal)</span>
          </div>
        </div>
      </div>

      {/* Download Action Button */}
      <button
        onClick={handleDownload}
        className="mt-4 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-2 border border-slate-700 shadow-md"
      >
        <Download className="w-4 h-4 text-sky-400" />
        <span>Download Shareable Diagnostic Card (PNG)</span>
      </button>
    </div>
  );
};
