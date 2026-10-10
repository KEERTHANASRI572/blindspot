import {
  User, CourseListItem, CourseDetail, Question, PracticeResult,
  UserProgress, AdminDashboardStats, AdminUser, Language
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('blindspot_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  signup: async (data: { name: string; email: string; password: string; language?: string }) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Signup failed');
    }
    return res.json();
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  adminLogin: async (password: string) => {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Admin login failed');
    }
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { authenticated: false };
    return res.json();
  },

  updateLanguage: async (language: Language) => {
    const res = await fetch(`${API_BASE}/auth/language?language=${language}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update language');
    return res.json();
  },

  // Learner Courses & Practice
  getPublishedCourses: async (lang: Language = 'en', search?: string): Promise<CourseListItem[]> => {
    const url = new URL(`${window.location.origin}${API_BASE}/courses`);
    url.searchParams.set('lang', lang);
    if (search) url.searchParams.set('search', search);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },

  getCourseForLearner: async (courseId: string, lang: Language = 'en') => {
    const res = await fetch(`${API_BASE}/courses/${courseId}?lang=${lang}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load course');
    }
    return res.json();
  },

  submitPracticeAnswer: async (data: {
    course_id: string;
    question_id: string;
    confidence: number;
    answer: string;
    hints_used: number;
    language?: string;
  }): Promise<PracticeResult> => {
    const res = await fetch(`${API_BASE}/practice/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit practice answer');
    }
    return res.json();
  },

  getUserProgress: async (): Promise<UserProgress> => {
    const res = await fetch(`${API_BASE}/progress/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user progress');
    return res.json();
  },

  // Admin APIs
  getAdminDashboard: async (): Promise<AdminDashboardStats> => {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Admin dashboard request failed');
    return res.json();
  },

  getAdminCourses: async (statusFilter: string = 'all', search?: string): Promise<CourseListItem[]> => {
    const url = new URL(`${window.location.origin}${API_BASE}/admin/courses`);
    url.searchParams.set('status_filter', statusFilter);
    if (search) url.searchParams.set('search', search);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin courses');
    return res.json();
  },

  createCourse: async (data: { title: string; description?: string; notes?: string; difficulty?: string }) => {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create course');
    }
    return res.json();
  },

  getAdminCourseDetail: async (courseId: string): Promise<CourseDetail> => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch course details');
    return res.json();
  },

  updateCourse: async (courseId: string, data: Partial<CourseDetail>) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update course');
    }
    return res.json();
  },

  publishCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to publish course');
    }
    return res.json();
  },

  unpublishCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/unpublish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to unpublish course');
    return res.json();
  },

  cancelCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cancel course');
    return res.json();
  },

  restoreCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore course');
    return res.json();
  },

  deleteCourse: async (courseId: string, confirmTitle: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirm_title: confirmTitle }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete course');
    }
    return res.json();
  },

  duplicateCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to duplicate course');
    return res.json();
  },

  loadSampleCourse: async () => {
    const res = await fetch(`${API_BASE}/admin/courses/load-sample`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load sample course');
    return res.json();
  },

  regenerateAllQuestions: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/regenerate-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start regeneration');
    return res.json();
  },

  addQuestionManual: async (courseId: string, data: any) => {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add question');
    return res.json();
  },

  updateQuestion: async (questionId: string, data: any) => {
    const res = await fetch(`${API_BASE}/admin/questions/${questionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update question');
    return res.json();
  },

  deleteQuestion: async (questionId: string) => {
    const res = await fetch(`${API_BASE}/admin/questions/${questionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return res.json();
  },

  getJobStatus: async (jobId: string) => {
    const res = await fetch(`${API_BASE}/admin/jobs/${jobId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get job status');
    return res.json();
  },

  cancelJob: async (jobId: string) => {
    const res = await fetch(`${API_BASE}/admin/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cancel job');
    return res.json();
  },

  getAdminUsers: async (): Promise<AdminUser[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Teach a Friend (Confused Student Mode)
  startTeach: async (courseId: string, conceptName: string, language: Language = 'en') => {
    const res = await fetch(`${API_BASE}/teach/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id: courseId, concept_name: conceptName, language }),
    });
    if (!res.ok) throw new Error('Failed to start Teach session');
    return res.json();
  },

  sendTeachChat: async (sessionId: string, message: string, history: any[], language: Language = 'en') => {
    const res = await fetch(`${API_BASE}/teach/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId, message, history, language }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  evaluateTeach: async (sessionId: string, history: any[]) => {
    const res = await fetch(`${API_BASE}/teach/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId, history }),
    });
    if (!res.ok) throw new Error('Failed to evaluate teaching');
    return res.json();
  },

  // Viva Simulator
  startViva: async (courseId: string, title: string, language: Language = 'en') => {
    const res = await fetch(`${API_BASE}/viva/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id: courseId, title, language }),
    });
    if (!res.ok) throw new Error('Failed to start Viva session');
    return res.json();
  },

  sendVivaAnswer: async (vivaSessionId: string, answer: string, language: Language = 'en') => {
    const res = await fetch(`${API_BASE}/viva/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ viva_session_id: vivaSessionId, answer, language }),
    });
    if (!res.ok) throw new Error('Failed to submit Viva answer');
    return res.json();
  },

  getVivaReport: async (vivaSessionId: string, language: Language = 'en') => {
    const res = await fetch(`${API_BASE}/viva/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ viva_session_id: vivaSessionId, language }),
    });
    if (!res.ok) throw new Error('Failed to generate Viva report');
    return res.json();
  },

  // Class Results (Study Lab)
  getClassResults: async (courseId: string = 'all') => {
    const res = await fetch(`${API_BASE}/admin/class-results?course_id=${courseId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load class results');
    return res.json();
  },
};

