import { createClient } from "@/lib/supabase";
import { SESSIONS } from "@/lib/questions";
import type { Session } from "@/types";

export async function fetchSessions(): Promise<Session[]> {
  const supabase = createClient();

  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!dbSessions || dbSessions.length === 0) {
    // Fallback to hardcoded if Supabase tables not set up yet
    return SESSIONS.map((s) => ({ ...s, dbId: s.id + 1 }));
  }

  const { data: dbQuestions } = await supabase
    .from("questions")
    .select("*")
    .order("sort_order", { ascending: true });

  return dbSessions.map((s) => ({
    id: s.sort_order,
    dbId: s.id,
    label: s.label,
    title: s.title,
    chapters: s.chapters,
    questions: (dbQuestions || [])
      .filter((q) => q.session_id === s.id)
      .map((q) => ({
        context: q.context,
        text: q.text,
        options: q.options as string[],
        correct: q.correct,
        explanation: q.explanation,
      })),
  }));
}
