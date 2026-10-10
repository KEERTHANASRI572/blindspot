import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, ChevronDown, ChevronUp, Lock, Unlock, HelpCircle } from 'lucide-react';

interface Hint {
  level: number;
  title: string;
  text: string;
}

interface SocraticHintLadderProps {
  hints: Hint[];
  hintsUsed: number;
  onHintUnlocked: (level: number) => void;
}

export const SocraticHintLadder: React.FC<SocraticHintLadderProps> = ({
  hints,
  hintsUsed,
  onHintUnlocked,
}) => {
  const { t } = useTranslation();
  const [unlockedLevel, setUnlockedLevel] = useState<number>(hintsUsed || 0);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const handleUnlock = (level: number) => {
    if (level > unlockedLevel) {
      setUnlockedLevel(level);
      onHintUnlocked(level);
    }
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  if (!hints || hints.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{t('practice.needHint')}</h4>
            <p className="text-xs text-slate-400">{t('practice.hintsTitle')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {hints.map((hint, idx) => {
          const level = hint.level || idx + 1;
          const isUnlocked = level <= unlockedLevel;
          const isExpanded = expandedLevel === level;
          const canUnlock = level === unlockedLevel + 1;
          const isFinal = level === 4;

          return (
            <div
              key={level}
              className={`rounded-2xl border transition-all ${
                isUnlocked
                  ? isFinal
                    ? 'bg-purple-950/20 border-purple-800/40'
                    : 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-75'
              }`}
            >
              <div
                onClick={() => {
                  if (isUnlocked) {
                    setExpandedLevel(isExpanded ? null : level);
                  } else if (canUnlock) {
                    handleUnlock(level);
                  }
                }}
                className="p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-1.5 rounded-lg text-xs font-bold ${
                      isUnlocked
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{hint.title}</h5>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <button
                      type="button"
                      disabled={!canUnlock}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                        canUnlock
                          ? isFinal
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isFinal ? t('practice.showAnswer') : `Unlock Hint ${level}`}
                    </button>
                  )}
                </div>
              </div>

              {isUnlocked && isExpanded && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/80 font-sans leading-relaxed">
                  <p className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-amber-200">
                    {hint.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
