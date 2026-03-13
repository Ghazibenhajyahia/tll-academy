"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { fetchSessions } from "@/lib/sessions";
import { useAuth } from "@/lib/auth-context";
import TopBar from "@/components/TopBar";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import type { Session } from "@/types";

export default function QuizClient() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading } = useAuth();
  const sessionIndex = Number(params.sessionId);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    fetchSessions().then((s) => {
      setSessions(s);
      setSessionsLoaded(true);
    });
  }, [loading, user, router]);

  const session = sessions[sessionIndex];

  const handleAnswer = useCallback((correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1);
  }, []);

  const handleNext = useCallback(async () => {
    if (!session) return;
    if (currentQ + 1 < session.questions.length) {
      setCurrentQ((q) => q + 1);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("session_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("session_id", session.dbId);

        await supabase.from("session_results").insert({
          user_id: user.id,
          session_index: sessionIndex,
          session_id: session.dbId,
          score: correctCount,
          total: session.questions.length,
          attempt: (count || 0) + 1,
        });

        const { data: results } = await supabase
          .from("session_results")
          .select("*")
          .eq("user_id", user.id);

        if (results && sessions.length > 0) {
          // Check certification: all sessions passed (by session DB id)
          const sessionDbIds = sessions.map((s) => s.dbId);
          const passedIds = new Set<number>();
          for (const r of results) {
            if (r.score / r.total >= 0.8) passedIds.add(r.session_id);
          }
          if (correctCount / session.questions.length >= 0.8) {
            passedIds.add(session.dbId);
          }
          if (sessionDbIds.every((id) => passedIds.has(id))) {
            await supabase
              .from("profiles")
              .update({ certified: true, certified_at: new Date().toISOString() })
              .eq("id", user.id);
          }
        }
      }

      router.push(`/results/${sessionIndex}?score=${correctCount}&total=${session.questions.length}`);
    }
  }, [currentQ, correctCount, session, sessions, sessionIndex, supabase, router]);

  if (!sessionsLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="relative z-[1]">
      <TopBar title={session.label} />
      <div className="pt-16 flex flex-col items-center">
        <div className="w-full max-w-[740px] px-5 py-[60px] sm:px-5 sm:py-10 flex-1">
          <div className="mb-12">
            <div className="text-[9px] tracking-[4px] text-gold uppercase mb-2.5">
              {session.label}
            </div>
            <div className="font-serif text-[32px] font-light text-cream mb-6">
              {session.title}
            </div>
            <ProgressBar current={currentQ + 1} total={session.questions.length} />
          </div>

          <QuestionCard
            key={currentQ}
            question={session.questions[currentQ]}
            questionIndex={currentQ}
            onAnswer={handleAnswer}
            onNext={handleNext}
            isLast={currentQ + 1 === session.questions.length}
          />

          <div className="text-[11px] tracking-[1px] text-grey mt-4">
            Score : <span className="text-gold font-medium">{correctCount}</span> / {currentQ}
          </div>
        </div>
      </div>
    </div>
  );
}
