import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { Download, CheckCircle, AlertTriangle, HelpCircle, Target } from 'lucide-react';
import { PracticeResult } from '../types';

interface ConfidenceGapCardProps {
  result: PracticeResult;
  courseTitle: string;
}

export const ConfidenceGapCard: React.FC<ConfidenceGapCardProps> = ({ result, courseTitle }) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `confidence-gap-${courseTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export card:', err);
    }
  };

  const isGreen = result.status_color === 'green';
  const isRed = result.status_color === 'red';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Visual Canvas Card */}
      <div
        ref={cardRef}
        className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl relative overflow-hidden text-center"
      >
        {/* Glow ambient */}
        <div
          className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25 ${
            isGreen ? 'bg-emerald-500' : isRed ? 'bg-rose-500' : 'bg-amber-500'
          }`}
        ></div>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
              🎯
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{t('confidenceGap.title')}</h4>
              <p className="text-[11px] text-slate-400 font-sans">{courseTitle}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            BLINDSPOT
          </span>
        </div>

        {/* Confidence vs Reality */}
        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t('confidenceGap.youFelt')}</span>
            <div className="text-3xl sm:text-4xl font-black text-sky-400 font-mono">
              {Math.round(result.confidence)}%
            </div>
            <span className="text-[11px] text-slate-400">{t('confidenceGap.sure')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t('confidenceGap.actualReality')}</span>
            <div
              className={`text-3xl sm:text-4xl font-black font-mono ${
                isGreen ? 'text-emerald-400' : isRed ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {Math.round(result.score)}%
            </div>
            <span className="text-[11px] text-slate-400">{t('confidenceGap.correct')}</span>
          </div>
        </div>

        {/* Big Gap Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold ${
            isGreen
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
              : isRed
              ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
          }`}
        >
          {isGreen ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{result.friendly_summary}</span>
        </div>

        {/* Evidence Quote from student */}
        {result.evidence_quote && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t('practice.yourWords')}
            </span>
            <p className="text-xs italic text-slate-300 font-sans">
              "{result.evidence_quote}"
            </p>
          </div>
        )}
      </div>

      {/* Action Download */}
      <button
        onClick={handleDownload}
        className="mt-4 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-md"
      >
        <Download className="w-4 h-4 text-sky-400" />
        <span>{t('confidenceGap.downloadCard')}</span>
      </button>
    </div>
  );
};
