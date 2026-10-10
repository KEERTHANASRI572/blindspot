import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, PlusCircle, MoreVertical, Edit2, Eye, Globe,
  Archive, RotateCcw, Trash2, Copy, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { CourseListItem } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AdminCoursesPageProps {
  onNavigate: (page: string) => void;
  onEditCourse: (courseId: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
}

// Helper to safely get the course title in the current language or fallback
export const getCourseTitle = (
  course?: Partial<CourseListItem> | null,
  lang: string = 'en',
  fallbackText: string = 'Untitled Course'
): string => {
  if (!course) return fallbackText;
  const langKey = `title_${lang}` as keyof CourseListItem;
  const val = (course[langKey] as string) ?? course.title ?? course.title_en ?? course.title_ta ?? course.title_hi;
  return (val && typeof val === 'string' && val.trim().length > 0) ? val : fallbackText;
};

// Helper to safely get the course description in the current language or fallback
export const getCourseDescription = (
  course?: Partial<CourseListItem> | null,
  lang: string = 'en',
  fallbackText: string = ''
): string => {
  if (!course) return fallbackText;
  const langKey = `description_${lang}` as keyof CourseListItem;
  const val = (course[langKey] as string) ?? course.description ?? course.description_en ?? course.description_ta ?? course.description_hi;
  return (val && typeof val === 'string') ? val : fallbackText;
};

const AdminCoursesContent: React.FC<AdminCoursesPageProps> = ({
  onNavigate,
  onEditCourse,
  onShowToast,
}) => {
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Active action menu row
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'delete';
    course: CourseListItem | null;
  }>({ isOpen: false, type: 'cancel', course: null });

  useEffect(() => {
    loadCourses();
  }, [statusFilter]);

  const loadCourses = () => {
    setLoading(true);
    api.getAdminCourses(statusFilter, searchQuery)
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load courses', err);
        setCourses([]);
      })
      .finally(() => setLoading(false));
  };

  const handlePublish = async (courseId: string) => {
    try {
      await api.publishCourse(courseId);
      onShowToast(t('toasts.coursePublished'), 'success');
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to publish course', 'error');
    }
  };

  const handleUnpublish = async (courseId: string) => {
    try {
      await api.unpublishCourse(courseId);
      onShowToast(t('toasts.courseUnpublished'), 'info', () => handlePublish(courseId));
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to unpublish', 'error');
    }
  };

  const handleCancelCourse = async (course: CourseListItem) => {
    try {
      await api.cancelCourse(course.id);
      onShowToast(t('toasts.courseCancelled'), 'info', () => handleRestore(course.id));
      setConfirmDialog({ isOpen: false, type: 'cancel', course: null });
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to cancel', 'error');
    }
  };

  const handleRestore = async (courseId: string) => {
    try {
      await api.restoreCourse(courseId);
      onShowToast(t('toasts.courseRestored'), 'success');
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to restore', 'error');
    }
  };

  const handleDeleteCourse = async (course: CourseListItem) => {
    try {
      const titleToConfirm = getCourseTitle(course, i18n.language, t('admin.untitledCourse'));
      await api.deleteCourse(course.id, titleToConfirm);
      onShowToast(t('toasts.courseDeleted'), 'success');
      setConfirmDialog({ isOpen: false, type: 'delete', course: null });
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleDuplicate = async (courseId: string) => {
    try {
      await api.duplicateCourse(courseId);
      onShowToast('Course duplicated as draft!', 'success');
      loadCourses();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to duplicate', 'error');
    }
  };

  const q = (searchQuery ?? '').toLowerCase().trim();
  const filtered = (courses ?? []).filter((c) => {
    if (!c) return false;
    const title = getCourseTitle(c, i18n.language, t('admin.untitledCourse')).toLowerCase();
    const desc = getCourseDescription(c, i18n.language, '').toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q);
    const courseStatus = (c.status ?? 'draft').toLowerCase();
    const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('admin.coursesManagement')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add, edit, translate, publish, or archive courses
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-course-new')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('admin.addCourseBtn')}</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            {t('admin.allTab')}
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'draft' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            {t('admin.draftTab')}
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'published' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            {t('admin.publishedTab')}
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'cancelled' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            {t('admin.cancelledTab')}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.searchCourses')}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Courses List Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-xs">Loading courses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 p-6">
            <p className="text-xs">{t('admin.emptyCourses')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Learners</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((course) => {
                  const courseStatus = (course.status ?? 'draft').toLowerCase();
                  const isPublished = courseStatus === 'published';
                  const isCancelled = courseStatus === 'cancelled';
                  const isDraft = courseStatus === 'draft';
                  const displayTitle = getCourseTitle(course, i18n.language, t('admin.untitledCourse'));

                  return (
                    <tr key={course.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate" title={displayTitle}>
                        {displayTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCancelled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {courseStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {course.question_count ?? 0}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {course.learners_enrolled ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {course.difficulty ?? 'Medium'}
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onEditCourse(course.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                            title={t('admin.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isDraft && (
                            <button
                              onClick={() => handlePublish(course.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            >
                              {t('admin.publish')}
                            </button>
                          )}

                          {isPublished && (
                            <button
                              onClick={() => handleUnpublish(course.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px]"
                            >
                              {t('admin.unpublish')}
                            </button>
                          )}

                          {isCancelled && (
                            <button
                              onClick={() => handleRestore(course.id)}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{t('admin.restore')}</span>
                            </button>
                          )}

                          {/* Action Overflow Menu */}
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === course.id ? null : course.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {actionMenuOpen === course.id && (
                              <div className="absolute right-0 top-8 z-30 w-44 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-1.5 text-left text-xs font-semibold space-y-1 animate-fadeIn">
                                <button
                                  onClick={() => {
                                    handleDuplicate(course.id);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{t('admin.duplicate')}</span>
                                </button>

                                {!isCancelled ? (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({ isOpen: true, type: 'cancel', course });
                                      setActionMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg hover:bg-amber-950/40 text-amber-300 flex items-center gap-2"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{t('admin.cancelCourse')}</span>
                                  </button>
                                ) : null}

                                <button
                                  onClick={() => {
                                    setConfirmDialog({ isOpen: true, type: 'delete', course });
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-300 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t('admin.delete')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {confirmDialog.isOpen && confirmDialog.course && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={
            confirmDialog.type === 'delete'
              ? t('dialogs.deleteCourseTitle')
              : t('dialogs.cancelCourseTitle')
          }
          description={
            confirmDialog.type === 'delete'
              ? t('dialogs.deleteCourseDesc')
              : t('dialogs.cancelCourseDesc')
          }
          type={confirmDialog.type}
          confirmMatchText={
            confirmDialog.type === 'delete'
              ? getCourseTitle(confirmDialog.course, i18n.language, t('admin.untitledCourse'))
              : undefined
          }
          onConfirm={() => {
            if (confirmDialog.type === 'delete') {
              handleDeleteCourse(confirmDialog.course!);
            } else {
              handleCancelCourse(confirmDialog.course!);
            }
          }}
          onCancel={() => setConfirmDialog({ isOpen: false, type: 'cancel', course: null })}
        />
      )}
    </div>
  );
};

// React Error Boundary to catch any unforeseen rendering errors in Admin Courses
export class AdminCoursesErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackMessage?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdminCoursesErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-rose-500/30 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Something went wrong</h3>
          <p className="text-sm text-slate-400">
            {this.props.fallbackMessage || 'An unexpected error occurred while loading courses.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AdminCoursesPage: React.FC<AdminCoursesPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <AdminCoursesErrorBoundary fallbackMessage={t('admin.errorBoundaryMessage')}>
      <AdminCoursesContent {...props} />
    </AdminCoursesErrorBoundary>
  );
};
