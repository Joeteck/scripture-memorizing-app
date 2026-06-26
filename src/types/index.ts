export type VerseStatus = "learning" | "mastered";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Verse {
  id: string;
  user_id: string;
  reference: string;
  content: string;
  translation: string;
  category_id: string | null;
  status: VerseStatus;
  date_started: string; // ISO date
  date_mastered: string | null;
  reminder_interval_minutes: number;
  created_at: string;
}

export interface BibleApiResult {
  reference: string;
  text: string;
  translation: string;
}
