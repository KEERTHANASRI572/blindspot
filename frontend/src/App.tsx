import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseStudyPage } from './pages/CourseStudyPage';
import { ProgressPage } from './pages/ProgressPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminCoursesPage } from './pages/AdminCoursesPage';
import { AdminCourseEditorPage } from './pages/AdminCourseEditorPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminClassResultsPage } from './pages/AdminClassResultsPage';
import { ToastContainer, ToastMessage } from './components/Toast';
import { RefreshCw } from 'lucide-react';
import { api, onServerWakingChange } from './services/api';
import { User, CourseListItem, Language } from './types';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('i18nextLng') as Language) || 'en'
  );

  // Server waking state for slow initial cloud spin-ups
  const [isServerWaking, setIsServerWaking] = useState(false);

  useEffect(() => {
    return onServerWakingChange(setIsServerWaking);
  }, []);

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  // Courses State
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [editorCourseId, setEditorCourseId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info', onUndo?: () => void) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setToasts((prev) => [...prev, { id, text, type, onUndo }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Current User on Mount
  useEffect(() => {
    const token = localStorage.getItem('blindspot_token');
    if (token) {
      api.getMe()
        .then((res) => {
          if (res.authenticated && res.user) {
            setCurrentUser(res.user);
            if (res.user.language) {
              setLanguage(res.user.language as Language);
              i18n.changeLanguage(res.user.language);
            }
            if (res.user.role === 'admin') {
              setCurrentPage('admin-dashboard');
            }
          } else {
            localStorage.removeItem('blindspot_token');
            setCurrentUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('blindspot_token');
          setCurrentUser(null);
        })
        .finally(() => {
          setIsInitializingAuth(false);
        });
    } else {
      setIsInitializingAuth(false);
    }
  }, [i18n]);

  // Fetch Published Courses when user is logged in
  const loadPublishedCourses = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getPublishedCourses(language);
      setCourses(data);
    } catch (err) {
      console.error('Failed to load published courses:', err);
    }
  }, [currentUser, language]);

  useEffect(() => {
    loadPublishedCourses();
  }, [loadPublishedCourses]);

  // Language Change Handler
  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    if (currentUser && currentUser.role === 'user') {
      try {
        await api.updateLanguage(newLang);
      } catch (err) {
        console.error('Failed to update language preference on server:', err);
      }
    }
  };

  // Login Success Handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('home');
    }
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('blindspot_token');
    setCurrentUser(null);
    setCurrentPage('home');
    showToast('Signed out successfully', 'info');
  };

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setCurrentPage('course-study');
  };

  const handleEditCourse = (courseId: string) => {
    setEditorCourseId(courseId);
    setCurrentPage('admin-course-editor');
  };

  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Unauthenticated users ALWAYS see the Welcome / Role Choice screen
  if (!currentUser) {
    return (
      <>
        <WelcomePage
          onLoginSuccess={handleLoginSuccess}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // 2. Authenticated App Flow
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenAuth={() => {}}
        onOpenAdminLogin={() => {}}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Learner Views */}
        {!isAdmin && (
          <>
            {currentPage === 'home' && (
              <HomePage
                currentUser={currentUser}
                courses={courses}
                onNavigate={setCurrentPage}
                onSelectCourse={handleSelectCourse}
                onOpenAdminLogin={() => {}}
              />
            )}

            {currentPage === 'courses' && (
              <CoursesPage
                courses={courses}
                onSelectCourse={handleSelectCourse}
              />
            )}

            {currentPage === 'course-study' && activeCourseId && (
              <CourseStudyPage
                courseId={activeCourseId}
                language={language}
                onBack={() => {
                  setActiveCourseId(null);
                  setCurrentPage('courses');
                }}
              />
            )}

            {currentPage === 'progress' && (
              <ProgressPage />
            )}
          </>
        )}

        {/* Admin Views */}
        {isAdmin && (
          <>
            {currentPage === 'admin-dashboard' && (
              <AdminDashboardPage
                onNavigate={setCurrentPage}
                onShowToast={showToast}
              />
            )}

            {currentPage === 'admin-courses' && (
              <AdminCoursesPage
                onNavigate={setCurrentPage}
                onEditCourse={handleEditCourse}
                onShowToast={showToast}
              />
            )}

            {(currentPage === 'admin-course-editor' || currentPage === 'admin-course-new') && (
              <AdminCourseEditorPage
                courseId={currentPage === 'admin-course-new' ? null : editorCourseId}
                onBack={() => {
                  setEditorCourseId(null);
                  setCurrentPage('admin-courses');
                  loadPublishedCourses();
                }}
                onShowToast={showToast}
              />
            )}

            {currentPage === 'admin-users' && (
              <AdminUsersPage />
            )}

            {currentPage === 'admin-class-results' && (
              <AdminClassResultsPage />
            )}
          </>
        )}
      </main>

      {/* Server Waking Indicator */}
      {isServerWaking && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-amber-300/40 animate-pulse pointer-events-none">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          <span>{t('app.wakingServer')}</span>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
