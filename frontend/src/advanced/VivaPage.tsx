import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Topic, Language, VivaTurn, VivaReport } from '../types';
import { Award, Mic, MicOff, Send, RefreshCw, Volume2, ShieldAlert, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

interface VivaPageProps {
  topics: Topic[];
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  language: Language;
}

export const VivaPage: React.FC<VivaPageProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  language,
}) => {
  const [vivaTurn, setVivaTurn] = useState<VivaTurn | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vivaReport, setVivaReport] = useState<VivaReport | null>(null);

  const recognitionRef = useRef<any>(null);

  const startVivaSession = async () => {
    try {
      setIsLoading(true);
      setVivaReport(null);
      setUserAnswer('');
      const firstTurn = await api.startViva(selectedTopicId, language);
      setVivaTurn(firstTurn);
    } catch (err) {
      console.error('Error starting viva:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startVivaSession();
  }, [selectedTopicId, language]);

  // Web Speech API speech-to-text setup
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. You can type your oral answers directly into the box!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setUserAnswer(currentText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vivaTurn || !userAnswer.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      setIsLoading(true);
      const nextTurn = await api.sendVivaAnswer(
        vivaTurn.viva_session_id,
        selectedTopicId,
        vivaTurn.question_index,
        userAnswer,
        language
      );
      setVivaTurn(nextTurn);
      setUserAnswer('');

      if (nextTurn.is_finished) {
        // Fetch Final Report
        const report = await api.getVivaReport(nextTurn.viva_session_id);
        setVivaReport(report);
      }
    } catch (err) {
      console.error('Viva turn error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Oral Exam Defense Simulator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">University Oral Viva Examination</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Face escalating oral questions, defend your reasoning in real time via microphone or text, and receive a Viva Report.
          </p>
        </div>

        <button
          onClick={startVivaSession}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restart Viva Exam</span>
        </button>
      </div>

      {vivaReport ? (
        /* Final Viva Report Card */
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          <div className="text-center pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/20">
              <Award className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Chief Examiner Verdict</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{vivaReport.overall_grade}</h3>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">Score: {Math.round(vivaReport.overall_score_0_100)} / 100</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Demonstrated Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {vivaReport.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/30">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Critical Blindspots Identified
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {vivaReport.critical_blindspots.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
              3 Mandatory Actionable Items for Revision
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              {vivaReport.three_action_revisions.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rev}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startVivaSession}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-xl hover:opacity-95 transition-all"
          >
            Take Another Viva Defense
          </button>
        </div>
      ) : (
        /* Active Viva Defense Interaction */
        vivaTurn && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            {/* Turn Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                  👨‍🏫
                </span>
                <div>
                  <span className="text-xs font-bold text-white block">External Viva Examiner</span>
                  <span className="text-[10px] text-slate-400">Tone: <strong className="text-amber-400 uppercase">{vivaTurn.examiner_tone}</strong></span>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-sky-400 font-bold">
                Question {vivaTurn.question_index} of {vivaTurn.total_questions}
              </span>
            </div>

            {/* Examiner Question Box */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Examiner Inquiry:</div>
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                "{vivaTurn.examiner_question}"
              </p>
            </div>

            {/* Candidate Oral Response Box */}
            <form onSubmit={handleSendAnswer} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Your Spoken / Typed Defense
                </label>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{isListening ? 'Stop Recording' : 'Use Voice (Web Speech API)'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Speak or type your oral defense. Be precise, detail mechanisms, and avoid hand-waving..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans"
              />

              <button
                type="submit"
                disabled={isLoading || !userAnswer.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-sky-500/20 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span>Deliver Defense to Examiner</span>
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
};
