"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { SESSIONS } from "@/lib/questions";
import { useAuth } from "@/lib/auth-context";
import TopBar from "@/components/TopBar";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";

export default function QuizClient() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading } = useAuth();
  const sessionIndex = Number(params.sessionId);
  const session = SESSIONS[sessionIndex];

  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleAnswer = useCallback((correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1);
  }, []);

  const handleNext = useCallback(async () => {
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
          .eq("session_index", sessionIndex);

        await supabase.from("session_results").insert({
          user_id: user.id,
          session_index: sessionIndex,
          score: correctCount,
          total: session.questions.length,
          attempt: (count || 0) + 1,
        });

        const { data: results } = await supabase
          .from("session_results")
          .select("*")
          .eq("user_id", user.id);

        if (results) {
          const bestScores = [false, false, false, false];
          for (const r of results) {
            if (r.score / r.total >= 0.8) bestScores[r.session_index] = true;
          }
          if (correctCount / session.questions.length >= 0.8) {
            bestScores[sessionIndex] = true;
          }
          if (bestScores.every(Boolean)) {
            await supabase
              .from("profiles")
              .update({ certified: true, certified_at: new Date().toISOString() })
              .eq("id", user.id);
          }
        }
      }

      router.push(`/results/${sessionIndex}?score=${correctCount}&total=${session.questions.length}`);
    }
  }, [currentQ, correctCount, session, sessionIndex, supabase, router]);

  if (!session) {
    router.push("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
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
