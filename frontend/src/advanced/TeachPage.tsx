import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Topic, Language, TeachChatTurn, TeachJudgeReport } from '../types';
import { Sparkles, Send, User, Bot, Award, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

interface TeachPageProps {
  topics: Topic[];
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  language: Language;
}

export const TeachPage: React.FC<TeachPageProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  language,
}) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<TeachChatTurn[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [studentState, setStudentState] = useState<string>('confused');
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [judgeReport, setJudgeReport] = useState<TeachJudgeReport | null>(null);

  const startNewSession = async () => {
    try {
      setIsLoading(true);
      setJudgeReport(null);
      setIsResolved(false);
      const res = await api.startTeachMode(selectedTopicId, undefined, language);
      setSessionId(res.session_id);
      setChatHistory([
        {
          sender: 'student',
          text: res.student_opening_message,
        },
      ]);
      setStudentState('confused');
    } catch (err) {
      console.error('Error starting teach session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startNewSession();
  }, [selectedTopicId, language]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userTurn: TeachChatTurn = { sender: 'user', text: inputMessage };
    const updatedHistory = [...chatHistory, userTurn];
    setChatHistory(updatedHistory);
    setInputMessage('');

    try {
      setIsLoading(true);
      const res = await api.sendTeachMessage(sessionId, selectedTopicId, userTurn.text, updatedHistory, language);
      setStudentState(res.student_state);
      setIsResolved(res.is_resolved);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'student',
          text: res.student_reply,
        },
      ]);
    } catch (err) {
      console.error('Error messaging student:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateTeaching = async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const report = await api.evaluateTeaching(sessionId, chatHistory);
      setJudgeReport(report);
    } catch (err) {
      console.error('Error evaluating teaching:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Protégé Effect Simulation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Confused Student Mode</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Alex holds a secret misconception. Guide and teach them until they resolve the flaw!
          </p>
        </div>

        <button
          onClick={startNewSession}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Student Scenario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Chat Arena */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between min-h-[500px]">
          {/* Student Status Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold">
                🎓
              </div>
              <div>
                <span className="font-bold text-white block">Alex (CS Student)</span>
                <span className="text-[10px] text-slate-400">State: <strong className="text-purple-400">{studentState}</strong></span>
              </div>
            </div>

            {isResolved && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Student Enlightened!
              </span>
            )}
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 my-4 overflow-y-auto max-h-[380px] pr-2">
            {chatHistory.map((msg, idx) => {
              const isStudent = msg.sender === 'student';
              return (
                <div
                  key={idx}
                  className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                      isStudent
                        ? 'bg-slate-900 border border-purple-500/20 text-purple-100 rounded-tl-sm'
                        : 'bg-sky-600 text-white rounded-tr-sm shadow-md'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-70 mb-1">
                      {isStudent ? 'Alex' : 'You (Tutor)'}
                    </div>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs animate-pulse">
                  Alex is typing...
                </div>
              </div>
            )}
          </div>

          {/* Message Input & Evaluate Button */}
          <div className="space-y-3 pt-2">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Explain the concept Socratic-style, give a concrete counterexample..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>

            <button
              onClick={handleEvaluateTeaching}
              className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Conclude Session & Request Pedagogical Judge Score</span>
            </button>
          </div>
        </div>

        {/* Right Col: Teaching Judge Report */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-purple-400">Judge Agent Rubric</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                Pedagogical AI
              </span>
            </div>

            {judgeReport ? (
              <div className="mt-4 space-y-4 animate-fadeIn">
                {/* Score Big */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 text-center">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Teaching Quality Score</span>
                  <div className="text-3xl font-black text-purple-300 font-mono my-1">
                    {Math.round(judgeReport.teaching_score_0_100)} / 100
                  </div>
                </div>

                {/* Secret Misconception Revealed */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Hidden Misconception Revealed:
                  </span>
                  <p className="font-bold text-rose-300">{judgeReport.hidden_misconception_revealed.name}</p>
                  <p className="text-slate-400 text-[11px] mt-1">{judgeReport.hidden_misconception_revealed.description}</p>
                </div>

                {/* Checkpoints */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span>Identified Flaw:</span>
                    <span className={judgeReport.did_identify_misconception ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {judgeReport.did_identify_misconception ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span>Explained Mechanism:</span>
                    <span className={judgeReport.did_explain_mechanism ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {judgeReport.did_explain_mechanism ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span>Provided Concrete Example:</span>
                    <span className={judgeReport.did_provide_concrete_example ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {judgeReport.did_provide_concrete_example ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-bold text-sky-400 block mb-1">Judge Feedback:</span>
                  {judgeReport.pedagogical_feedback}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                <p>Chat with Alex and click "Conclude Session" when you feel you've repaired their mental model.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
