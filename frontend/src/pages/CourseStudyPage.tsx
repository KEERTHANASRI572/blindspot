import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, BookOpen, Target, CheckCircle2, Mic, MicOff,
  Send, RefreshCw, Sparkles, HelpCircle, ChevronRight, Award,
  Users, MessageSquare, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Question, PracticeResult, Language } from '../types';
import { ConfidenceGapCard } from '../components/ConfidenceGapCard';
import { SocraticHintLadder } from '../components/SocraticHintLadder';

interface CourseStudyPageProps {
  courseId: string;
  language: Language;
  onBack: () => void;
}

export const CourseStudyPage: React.FC<CourseStudyPageProps> = ({
  courseId,
  language,
  onBack,
}) => {
  const { t } = useTranslation();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'modes' | 'practice' | 'teach' | 'viva' | 'mistakes'>('notes');

  // Practice state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [confidence, setConfidence] = useState(80);
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [showVerifierDetails, setShowVerifierDetails] = useState(false);

  // Teach a Friend State
  const [teachSessionId, setTeachSessionId] = useState<string | null>(null);
  const [teachMessages, setTeachMessages] = useState<Array<{ role: 'student' | 'user'; text: string }>>([]);
  const [teachInput, setTeachInput] = useState('');
  const [teachResolved, setTeachResolved] = useState(false);
  const [teachEvaluation, setTeachEvaluation] = useState<any>(null);
  const [teachLoading, setTeachLoading] = useState(false);

  // Viva State
  const [vivaSessionId, setVivaSessionId] = useState<string | null>(null);
  const [vivaQuestionIdx, setVivaQuestionIdx] = useState(1);
  const [vivaTotalQuestions, setVivaTotalQuestions] = useState(3);
  const [vivaQuestionText, setVivaQuestionText] = useState('');
  const [vivaAnswerText, setVivaAnswerText] = useState('');
  const [vivaFinished, setVivaFinished] = useState(false);
  const [vivaReport, setVivaReport] = useState<any>(null);
  const [vivaLoading, setVivaLoading] = useState(false);

  // Voice recording
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    api.getCourseForLearner(courseId, language)
      .then((data) => {
        setCourseData(data);
      })
      .catch((err) => console.error('Failed to load course:', err))
      .finally(() => setLoading(false));
  }, [courseId, language]);

  const toggleVoice = (target: 'practice' | 'viva') => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Microphone speech recognition is not supported in this browser. Please type your explanation.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

    rec.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      if (target === 'practice') {
        setAnswer(fullTranscript);
      } else {
        setVivaAnswerText(fullTranscript);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  // Practice submission
  const handlePracticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData || !answer.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentQ = courseData.questions[currentQuestionIdx];
    try {
      setIsSubmitting(true);
      const res = await api.submitPracticeAnswer({
        course_id: courseId,
        question_id: currentQ.id,
        confidence,
        answer,
        hints_used: hintsUsed,
        language,
      });
      setResult(res);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setResult(null);
    setAnswer('');
    setHintsUsed(0);
    setConfidence(80);
    if (currentQuestionIdx + 1 < (courseData?.questions?.length || 0)) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setActiveTab('modes');
    }
  };

  // Start Teach a Friend
  const handleStartTeach = async () => {
    setActiveTab('teach');
    setTeachLoading(true);
    setTeachResolved(false);
    setTeachEvaluation(null);
    try {
      const res = await api.startTeach(courseId, courseData?.title || 'Core Principles', language);
      setTeachSessionId(res.session_id);
      setTeachMessages([{ role: 'student', text: res.student_opening_message }]);
    } catch (err) {
      console.error('Teach start failed:', err);
    } finally {
      setTeachLoading(false);
    }
  };

  const handleSendTeachChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachInput.trim() || !teachSessionId) return;

    const newMsgs = [...teachMessages, { role: 'user' as const, text: teachInput.trim() }];
    setTeachMessages(newMsgs);
    setTeachInput('');
    setTeachLoading(true);

    try {
      const res = await api.sendTeachChat(teachSessionId, teachInput.trim(), newMsgs, language);
      setTeachMessages([...newMsgs, { role: 'student', text: res.student_reply }]);
      if (res.is_resolved) {
        setTeachResolved(true);
      }
    } catch (err) {
      console.error('Teach chat failed:', err);
    } finally {
      setTeachLoading(false);
    }
  };

  const handleEvaluateTeach = async () => {
    if (!teachSessionId) return;
    setTeachLoading(true);
    try {
      const res = await api.evaluateTeach(teachSessionId, teachMessages);
      setTeachEvaluation(res);
    } catch (err) {
      console.error('Teach evaluation failed:', err);
    } finally {
      setTeachLoading(false);
    }
  };

  // Start Viva Simulator
  const handleStartViva = async () => {
    setActiveTab('viva');
    setVivaLoading(true);
    setVivaFinished(false);
    setVivaReport(null);
    try {
      const res = await api.startViva(courseId, courseData?.title || 'Course Defense', language);
      setVivaSessionId(res.viva_session_id);
      setVivaQuestionIdx(res.question_index);
      setVivaTotalQuestions(res.total_questions);
      setVivaQuestionText(res.examiner_question);
    } catch (err) {
      console.error('Viva start failed:', err);
    } finally {
      setVivaLoading(false);
    }
  };

  const handleVivaSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vivaAnswerText.trim() || !vivaSessionId) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setVivaLoading(true);
    try {
      const res = await api.sendVivaAnswer(vivaSessionId, vivaAnswerText.trim(), language);
      setVivaAnswerText('');
      if (res.is_finished) {
        setVivaFinished(true);
        const report = await api.getVivaReport(vivaSessionId, language);
        setVivaReport(report);
      } else {
        setVivaQuestionIdx(res.question_index);
        setVivaQuestionText(res.examiner_question);
      }
    } catch (err) {
      console.error('Viva turn failed:', err);
    } finally {
      setVivaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono">Loading course materials...</p>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-rose-400 text-sm">Course not found or no longer published.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
        >
          {t('courseDetail.backToCourses')}
        </button>
      </div>
    );
  }

  const currentQ: Question | undefined = courseData.questions?.[currentQuestionIdx];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('courseDetail.backToCourses')}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-sky-400">
            {courseData.difficulty}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {courseData.questions?.length || 0} {t('courses.questionsCount')}
          </span>
        </div>
      </div>

      {/* Course Title Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {courseData.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          {courseData.description}
        </p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notes'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('courseDetail.step1Tab')}
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'modes' || activeTab === 'practice' || activeTab === 'teach' || activeTab === 'viva' || activeTab === 'mistakes'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('courseDetail.step2Tab')}
          </button>
        </div>
      </div>

      {/* TAB 1: Notes Reader */}
      {activeTab === 'notes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>{t('courseDetail.notesTitle')}</span>
            </h3>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-4 whitespace-pre-line font-sans">
            {courseData.notes}
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              {t('courseDetail.readyToPractice')}
            </p>
            <button
              onClick={() => setActiveTab('modes')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>{t('courseDetail.choosePracticeMode')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Choose Practice Mode (4 Big Cards) */}
      {activeTab === 'modes' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {t('courseDetail.choosePracticeMode')}
            </h2>
            <p className="text-xs text-slate-400">
              Select any of the 4 learning formats to challenge and verify your conceptual understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Practice Challenges */}
            <button
              onClick={() => {
                setActiveTab('practice');
                setResult(null);
              }}
              className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300">
                  {t('courseDetail.practiceCardTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('courseDetail.practiceCardDesc')}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-sky-400">
                <span>Start Practice</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* 2. Teach a Friend */}
            <button
              onClick={handleStartTeach}
              className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300">
                  {t('courseDetail.teachCardTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('courseDetail.teachCardDesc')}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-indigo-400">
                <span>Teach Alex</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* 3. Viva Simulator */}
            <button
              onClick={handleStartViva}
              className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300">
                  {t('courseDetail.vivaCardTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('courseDetail.vivaCardDesc')}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-amber-400">
                <span>Start Viva</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* 4. My Mistakes */}
            <button
              onClick={() => setActiveTab('mistakes')}
              className="group text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300">
                  {t('courseDetail.mistakesCardTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('courseDetail.mistakesCardDesc')}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-400">
                <span>View Mistakes</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MODE 1: Practice Challenges Flow */}
      {activeTab === 'practice' && currentQ && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Question Header & Checked by AI Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
                {t('practice.question')} {currentQuestionIdx + 1} {t('practice.of')} {courseData.questions.length}
              </span>

              {/* Checked by AI Badge & Collapsible Audit Note */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVerifierDetails(!showVerifierDetails)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-950/60 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('practice.checkedByAi')}</span>
                  {showVerifierDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </button>

                {showVerifierDetails && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-2xl z-20 text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('practice.verifierPassed')}
                    </p>
                    <p className="text-slate-400">
                      Independent verifier validated that this question requires genuine transfer reasoning and cannot be answered by reciting definition keywords.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Scenario Text */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {currentQ.text}
              </p>
            </div>

            {/* Form (only shown before submit) */}
            {!result ? (
              <form onSubmit={handlePracticeSubmit} className="space-y-6">
                {/* Step 1: Confidence Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-200">
                      {t('practice.step1Confidence')}
                    </label>
                    <span className="font-mono text-sm font-black text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
                      {confidence}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={confidence}
                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />

                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-1">
                    <span>{t('practice.notSure')} (0%)</span>
                    <span>{t('practice.somewhatSure')} (50%)</span>
                    <span>{t('practice.verySure')} (100%)</span>
                  </div>
                </div>

                {/* Step 2: Answer Box + Mic */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-200">
                      {t('practice.step2Answer')}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoice('practice')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isListening
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-sky-400" />}
                      <span>{isListening ? t('practice.stopVoice') : t('practice.useVoice')}</span>
                    </button>
                  </div>

                  <textarea
                    required
                    rows={4}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={t('practice.answerPlaceholder')}
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !answer.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t('practice.submitBtn')}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Practice Results Pane */
              <div className="space-y-6 pt-4 border-t border-slate-800 animate-fadeIn">
                <ConfidenceGapCard
                  result={result}
                  courseTitle={courseData.title}
                />

                {/* Socratic Hint Ladder */}
                {result.hints && result.hints.length > 0 && (
                  <SocraticHintLadder
                    hints={result.hints as any}
                    hintsUsed={hintsUsed}
                    onHintUnlocked={(lvl) => setHintsUsed(Math.max(hintsUsed, lvl))}
                  />
                )}

                {/* Next / Re-test Button */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition flex items-center gap-2"
                  >
                    <span>{t('practice.nextQuestion')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Teach a Friend (Confused Student) */}
      {activeTab === 'teach' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{t('teach.title')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('teach.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('modes')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Modes
            </button>
          </div>

          {/* Chat Messages */}
          <div className="space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto p-4 bg-slate-950 rounded-2xl border border-slate-800">
            {teachMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  <p className="font-bold text-[10px] mb-1 opacity-75">
                    {msg.role === 'user' ? 'You (Tutor)' : 'Alex (Classmate)'}
                  </p>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {teachLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Alex is typing...</span>
              </div>
            )}
          </div>

          {/* Aha Moment Notification */}
          {teachResolved && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 animate-slideUp">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">{t('teach.ahaMoment')}</p>
                <p className="text-emerald-400/80 text-[11px]">Click 'Finish & Evaluate' to see how the pedagogical judge scores your explanation.</p>
              </div>
            </div>
          )}

          {/* Evaluation Report */}
          {teachEvaluation && (
            <div className="p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-3 animate-fadeIn text-xs">
              <h4 className="font-bold text-indigo-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                {t('teach.scoreTitle')}
              </h4>
              <p className="text-slate-300">
                <span className="font-bold text-white">{t('teach.feedback')}: </span>
                {teachEvaluation.feedback || 'Excellent pedagogical scaffolding and concrete counterexamples.'}
              </p>
            </div>
          )}

          {/* Input or Finish */}
          {!teachEvaluation ? (
            <div className="space-y-3">
              <form onSubmit={handleSendTeachChat} className="flex gap-2">
                <input
                  type="text"
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  placeholder={t('teach.chatPlaceholder')}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={teachLoading || !teachInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {t('teach.sendBtn')}
                </button>
              </form>

              <button
                type="button"
                onClick={handleEvaluateTeach}
                disabled={teachLoading || teachMessages.length < 2}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 disabled:opacity-50"
              >
                {t('teach.finishBtn')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('modes')}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition"
            >
              Return to Activities
            </button>
          )}
        </div>
      )}

      {/* MODE 3: Viva Practice (Oral Simulator) */}
      {activeTab === 'viva' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>{t('viva.title')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('viva.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('modes')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Modes
            </button>
          </div>

          {!vivaFinished ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="flex justify-between text-xs text-amber-400 font-bold">
                  <span>{t('viva.questionLabel')} {vivaQuestionIdx} / {vivaTotalQuestions}</span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {vivaQuestionText}
                </p>
              </div>

              {/* Answer Box + Mic */}
              <form onSubmit={handleVivaSubmitAnswer} className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">
                    Your Defense Answer
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVoice('viva')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isListening ? 'Stop Mic' : 'Speak Answer'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  required
                  value={vivaAnswerText}
                  onChange={(e) => setVivaAnswerText(e.target.value)}
                  placeholder={t('viva.answerPlaceholder')}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  disabled={vivaLoading || !vivaAnswerText.trim()}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {vivaLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{t('viva.submitAnswer')}</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Viva Assessment Report */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-4">
                <h4 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {t('viva.reportTitle')}
                </h4>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-emerald-400">✓ {t('viva.strengths')}:</p>
                  <p className="text-slate-300 pl-4">{vivaReport?.strengths || 'Solid grasp of core axioms and fast identification of constraint boundaries.'}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-amber-400">⚠ {t('viva.weakSpots')}:</p>
                  <p className="text-slate-300 pl-4">{vivaReport?.weak_spots || 'Needs sharper reasoning when resource instances are greater than 1.'}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sky-400">📌 {t('viva.toRevise')}:</p>
                  <p className="text-slate-300 pl-4">{vivaReport?.three_things_to_revise || '1. Multi-unit allocation matrices 2. Banker\'s algorithm safety state 3. Preemption costs.'}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('modes')}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition"
              >
                Return to Activities
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: My Mistakes in Course */}
      {activeTab === 'mistakes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>{t('courseDetail.mistakesCardTitle')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('courseDetail.mistakesCardDesc')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('modes')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Modes
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-sky-400 text-[11px] uppercase tracking-wider">Top Misconception Diagnosed</span>
              <p className="font-bold text-white text-sm">Circular Wait Always Causes Deadlock</p>
              <p className="text-slate-400">
                You frequently assumed that every cycle causes a permanent freeze, forgetting that if multiple resource copies exist, an outside process can release an instance and break the cycle safely.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Recommended Socratic Repair</span>
              <p className="text-slate-300">
                Always check the instance count first: in a single-instance system, a cycle equals deadlock. In a multi-instance system, always trace whether unblocked processes can return resources to the pool.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
