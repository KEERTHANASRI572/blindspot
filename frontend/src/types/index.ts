export type Language = 'en' | 'ta' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  language: string;
}

export interface CourseListItem {
  id: string;
  title?: string;
  title_en?: string;
  title_ta?: string;
  title_hi?: string;
  description?: string;
  description_en?: string;
  description_ta?: string;
  description_hi?: string;
  difficulty?: string;
  status: 'draft' | 'published' | 'cancelled' | string;
  question_count?: number;
  learners_enrolled?: number;
  created_at?: string;
  updated_at?: string;
  is_new?: boolean;
  is_updated?: boolean;
}

export interface Question {
  id: string;
  course_id: string;
  text_en: string;
  text_ta?: string;
  text_hi?: string;
  text?: string;
  key_points: string[];
  hints_en: { level: number; title: string; text: string }[];
  hints_ta?: { level: number; title: string; text: string }[];
  hints_hi?: { level: number; title: string; text: string }[];
  hints?: { level: number; title: string; text: string }[];
  verifier_result?: {
    is_valid: boolean;
    ambiguity_score?: number;
    transfer_depth?: string;
    trust_note?: string;
  };
  approved: boolean;
  manually_edited: boolean;
  position: number;
}

export interface CourseDetail {
  id: string;
  title_en: string;
  title_ta: string;
  title_hi: string;
  description_en: string;
  description_ta: string;
  description_hi: string;
  notes: string;
  difficulty: string;
  status: 'draft' | 'published' | 'cancelled';
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface PracticeResult {
  attempt_id: string;
  confidence: number;
  score: number;
  gap: number;
  status_color: 'green' | 'amber' | 'red';
  friendly_summary: string;
  misconception_name?: string;
  evidence_quote?: string;
  explanation: string;
  hints: { level: number; title: string; text: string }[];
}

export interface UserProgress {
  average_gap: number;
  courses_completed: number;
  total_attempts: number;
  history: {
    date: string;
    confidence: number;
    score: number;
    gap: number;
  }[];
  top_mistake: string;
  top_strength: string;
}

export interface AdminDashboardStats {
  total_courses: number;
  total_learners: number;
  average_confidence_gap: number;
  recent_activity: {
    id: string;
    action: string;
    course_id?: string;
    details: string;
    time: string;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  language: string;
  created_at: string;
  attempts_count: number;
  average_gap: number;
}
