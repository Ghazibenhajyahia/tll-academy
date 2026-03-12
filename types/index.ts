export interface Profile {
  id: string;
  name: string;
  email: string;
  city: string | null;
  is_admin: boolean;
  certified: boolean;
  certified_at: string | null;
  created_at: string;
}

export interface SessionResult {
  id: string;
  user_id: string;
  session_index: number;
  score: number;
  total: number;
  passed: boolean;
  attempt: number;
  completed_at: string;
}

export interface Question {
  context: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Session {
  id: number;
  label: string;
  title: string;
  chapters: string;
  questions: Question[];
}

export interface SessionScore {
  score: number;
  total: number;
  passed: boolean;
}
