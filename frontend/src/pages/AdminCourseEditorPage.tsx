import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, Upload, Sparkles, RefreshCw, Trash2, Edit3,
  Plus, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Globe, Shield, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { CourseDetail, Question, Language } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AdminCourseEditorPageProps {
  courseId: string | null; // null for new course
  onBack: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AdminCourseEditorContent: React.FC<AdminCourseEditorPageProps> = ({
  courseId,
  onBack,
  onShowToast,
}) => {
  const { t } = useTranslation();
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(courseId);

  // Safe initial state for all course fields
  const [course, setCourse] = useState<Partial<CourseDetail>>({
    title_en: '',
    title_ta: '',
    title_hi: '',
    description_en: '',
    description_ta: '',
    description_hi: '',
    notes: '',
    difficulty: 'Easy',
    status: 'draft',
    questions: [],
  });

  const [loading, setLoading] = useState(Boolean(courseId));
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Active review language tab for questions
  const [reviewLang, setReviewLang] = useState<Language>('en');

  // Background Job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Technical details collapsible
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Discard dialog
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    if (currentCourseId) {
      loadCourseDetail(currentCourseId);
    }
  }, [currentCourseId]);

  const loadCourseDetail = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.getAdminCourseDetail(id);
      setCourse({
        ...data,
        questions: data?.questions ?? [],
      });
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      onShowToast(err.message || 'Failed to load course details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Background Job polling
  useEffect(() => {
    if (!activeJobId || !isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const job = await api.getJobStatus(activeJobId);
        if (job) {
          setJobProgress(job.progress || '');
          if (job.status === 'completed' || job.status === 'done') {
            setIsGenerating(false);
            setActiveJobId(null);
            setGenerationError(null);
            if (currentCourseId) {
              loadCourseDetail(currentCourseId);
              onShowToast('Questions and translations generated successfully!', 'success');
            }
          } else if (job.status === 'failed') {
            setIsGenerating(false);
            setActiveJobId(null);
            setGenerationError(t('admin.generationFailed'));
            onShowToast(t('admin.generationFailed'), 'error');
            if (currentCourseId) loadCourseDetail(currentCourseId);
          } else if (job.status === 'cancelled') {
            setIsGenerating(false);
            setActiveJobId(null);
            setGenerationError(null);
            onShowToast(t('admin.generationCancelled'), 'info');
            if (currentCourseId) loadCourseDetail(currentCourseId);
          }
        }
      } catch (err) {
        console.error('Job poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, isGenerating, currentCourseId, t]);

  const handleCancelJob = async () => {
    if (!activeJobId) return;
    try {
      await api.cancelJob(activeJobId);
      setIsGenerating(false);
      setActiveJobId(null);
      onShowToast(t('admin.generationCancelled'), 'info');
    } catch (err) {
      console.error('Cancel job error:', err);
    }
  };

  const handleSave = async (publishAfter: boolean = false) => {
    const title = (course?.title_en ?? '').trim();
    if (!title || title.length < 2) {
      setTitleError(t('admin.titleRequired'));
      onShowToast(t('admin.titleRequired'), 'error');
      return;
    }
    setTitleError(null);

    try {
      setSaving(true);
      if (!currentCourseId) {
        // Create new course
        const res = await api.createCourse({
          title,
          description: (course?.description_en ?? '').trim(),
          notes: (course?.notes ?? '').trim(),
          difficulty: course?.difficulty || 'Easy',
        });

        const newId = res.id || res.course_id;
        setCurrentCourseId(newId);
        setHasUnsavedChanges(false);

        if (res.job_id) {
          setActiveJobId(res.job_id);
          setIsGenerating(true);
          setJobProgress(t('admin.generationProgressDefault'));
        }

        onShowToast('Course created as draft! Generating questions...', 'success');
      } else {
        // Update existing course
        await api.updateCourse(currentCourseId, course);
        if (publishAfter) {
          await api.publishCourse(currentCourseId);
          onShowToast(t('toasts.coursePublished'), 'success');
        } else {
          onShowToast(t('toasts.courseSaved'), 'success');
        }
        setHasUnsavedChanges(false);
        loadCourseDetail(currentCourseId);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save course', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAll = async () => {
    if (!currentCourseId) return;
    try {
      const res = await api.regenerateAllQuestions(currentCourseId);
      setActiveJobId(res.job_id);
      setIsGenerating(true);
      setGenerationError(null);
      onShowToast('Regenerating questions in background...', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to start regeneration', 'error');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await api.deleteQuestion(qId);
      onShowToast('Question deleted', 'success');
      if (currentCourseId) loadCourseDetail(currentCourseId);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete question', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) ?? '';
      setCourse((prev) => ({ ...prev, notes: content }));
      setHasUnsavedChanges(true);
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
        <p className="text-xs">Loading course details...</p>
      </div>
    );
  }

  const questionsList = course?.questions ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) setShowDiscardDialog(true);
              else onBack();
            }}
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('admin.backToCourses')}</span>
          </button>
          <span className="text-slate-600">|</span>
          <h2 className="text-base sm:text-lg font-black text-white">
            {currentCourseId ? (course.title_en || 'Edit Course') : t('admin.createCourseTitle')}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) setShowDiscardDialog(true);
              else onBack();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            {t('admin.discardChanges')}
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{currentCourseId ? t('admin.saveDraft') : t('admin.createCourseTitle')}</span>
          </button>

          {currentCourseId && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
            >
              {t('admin.savePublish')}
            </button>
          )}
        </div>
      </div>

      {/* AI Generation Progress Notification Banner */}
      {isGenerating && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            <div>
              <span className="font-bold text-amber-300 block">{t('admin.generatingJob')}</span>
              <span className="text-slate-300">
                {jobProgress || t('admin.generationProgressDefault')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelJob}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
          >
            {t('admin.cancelJob')}
          </button>
        </div>
      )}

      {/* Generation Error Banner with Retry */}
      {generationError && !isGenerating && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-rose-200">{generationError}</span>
          </div>
          <button
            type="button"
            onClick={handleRegenerateAll}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
          >
            {t('admin.retryGeneration')}
          </button>
        </div>
      )}

      {/* Course Metadata Form */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div>
          <h3 className="text-lg font-black text-white">
            {currentCourseId ? 'Course Overview & Content' : t('admin.createCourseTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('admin.createCourseSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {t('admin.courseTitle')} *
            </label>
            <input
              type="text"
              value={course.title_en ?? ''}
              onChange={(e) => {
                setCourse({ ...course, title_en: e.target.value });
                setHasUnsavedChanges(true);
                if (titleError) setTitleError(null);
              }}
              placeholder="e.g. Thermodynamics or Deadlocks in Everyday Life"
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none ${
                titleError ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-amber-500'
              }`}
            />
            {titleError && (
              <p className="text-xs text-rose-400 font-medium">{titleError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {t('admin.difficultyLabel')}
            </label>
            <select
              value={course.difficulty ?? 'Easy'}
              onChange={(e) => {
                setCourse({ ...course, difficulty: e.target.value });
                setHasUnsavedChanges(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="Easy">Easy (Everyday analogies)</option>
              <option value="Medium">Medium (Applied systems)</option>
              <option value="Hard">Hard (Deep edge cases)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            {t('admin.shortDescription')}
          </label>
          <input
            type="text"
            value={course.description_en ?? ''}
            onChange={(e) => {
              setCourse({ ...course, description_en: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="A short, friendly 1-2 sentence description..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Notes input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300">
              {t('admin.notesOptional')}
            </label>
            <label className="cursor-pointer text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .TXT / .MD</span>
              <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            rows={6}
            value={course.notes ?? ''}
            onChange={(e) => {
              setCourse({ ...course, notes: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="Paste your course notes or lecture explanation here, or leave blank to let AI generate scenarios..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
          />
        </div>
      </div>

      {/* Multilingual Question Review & Editing Section */}
      {currentCourseId && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">{t('admin.questionsListTitle')}</h3>
              <p className="text-xs text-slate-400">Review practice scenarios and translations</p>
            </div>

            {/* Language Review Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setReviewLang('en')}
                className={`px-3 py-1 rounded-lg transition-all ${reviewLang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setReviewLang('ta')}
                className={`px-3 py-1 rounded-lg transition-all ${reviewLang === 'ta' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                தமிழ் (Tamil)
              </button>
              <button
                type="button"
                onClick={() => setReviewLang('hi')}
                className={`px-3 py-1 rounded-lg transition-all ${reviewLang === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Questions Accordion / List */}
          {questionsList.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              {isGenerating ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p className="text-xs text-slate-300 font-medium">
                    {jobProgress || t('admin.generationProgressDefault')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">{t('admin.noQuestionsYet')}</p>
                  <button
                    type="button"
                    onClick={handleRegenerateAll}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('admin.retryGeneration')}</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questionsList.map((q, idx) => {
                const qText =
                  reviewLang === 'ta'
                    ? (q.text_ta || q.text_en || '')
                    : reviewLang === 'hi'
                    ? (q.text_hi || q.text_en || '')
                    : (q.text_en || '');

                const hints =
                  reviewLang === 'ta'
                    ? (q.hints_ta || q.hints_en || [])
                    : reviewLang === 'hi'
                    ? (q.hints_hi || q.hints_en || [])
                    : (q.hints_en || []);

                return (
                  <div key={q.id || idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="font-bold text-amber-400">
                        Scenario {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title={t('admin.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {qText}
                    </p>

                    {/* Hints Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {hints.slice(0, 4).map((h: any, hIdx: number) => (
                        <div key={hIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                          <strong className="text-amber-300 block">{h?.title || `Hint ${hIdx + 1}`}</strong>
                          <span className="line-clamp-2">{h?.text || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {questionsList.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleRegenerateAll}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('admin.regenerateAll')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Technical Details (Admin Only) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>{t('admin.technicalDetails')}</span>
          </span>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 font-mono space-y-2 animate-fadeIn">
            <p>• Dual-Agent Verifier: Each scenario is validated against keyword recall bias and factual correctness.</p>
            <p>• Bayesian Knowledge Tracing parameters: Prior P(L0)=0.30, Transition P(T)=0.20, Slip P(S)=0.10, Guess P(G)=0.15.</p>
            <p>• Confidence Gap equation: Confidence Gap = Declared Confidence - Actual Score.</p>
          </div>
        )}
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <ConfirmDialog
          isOpen={showDiscardDialog}
          title={t('dialogs.discardTitle')}
          description={t('dialogs.discardDesc')}
          type="discard"
          confirmBtnText={t('dialogs.discardBtn')}
          cancelBtnText={t('dialogs.keepEditing')}
          onConfirm={() => {
            setShowDiscardDialog(false);
            onBack();
          }}
          onCancel={() => setShowDiscardDialog(false)}
        />
      )}
    </div>
  );
};

// Error Boundary for Admin Course Editor
export class AdminCourseEditorErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackMessage?: string; onBack?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallbackMessage?: string; onBack?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdminCourseEditorErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-rose-500/30 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Something went wrong in the Course Editor</h3>
          <p className="text-sm text-slate-400">
            {this.props.fallbackMessage || 'An unexpected error occurred while editing the course.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            {this.props.onBack && (
              <button
                type="button"
                onClick={this.props.onBack}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                Back to Courses
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AdminCourseEditorPage: React.FC<AdminCourseEditorPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <AdminCourseEditorErrorBoundary
      fallbackMessage={t('admin.editorErrorBoundaryMessage')}
      onBack={props.onBack}
    >
      <AdminCourseEditorContent {...props} />
    </AdminCourseEditorErrorBoundary>
  );
};
