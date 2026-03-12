"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { SESSIONS } from "@/lib/questions";
import TopBar from "@/components/TopBar";
import SessionCard from "@/components/SessionCard";
import type { SessionScore } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [scores, setScores] = useState<(SessionScore | null)[]>([null, null, null, null]);
  const [scoresLoaded, setScoresLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadScores();
  }, [authLoading, user]);

  const loadScores = async () => {
    if (!user) return;
    const { data: results } = await supabase
      .from("session_results")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (results) {
      const bestScores: (SessionScore | null)[] = [null, null, null, null];
      for (const r of results) {
        const idx = r.session_index;
        if (
          !bestScores[idx] ||
          r.score / r.total > bestScores[idx]!.score / bestScores[idx]!.total
        ) {
          bestScores[idx] = {
            score: r.score,
            total: r.total,
            passed: r.score / r.total >= 0.8,
          };
        }
      }
      setScores(bestScores);
    }
    setScoresLoaded(true);
  };

  const allPassed = scores.every((s) => s?.passed);
  const firstAvailable = scores.findIndex((s) => !s || !s.passed);
  const nextSession = firstAvailable >= 0 ? firstAvailable : 0;

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    return scores[idx - 1]?.passed === true;
  };

  if (authLoading || !scoresLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="relative z-[1]">
      <TopBar />
      <div className="flex flex-col items-center text-center pt-[100px] px-5 pb-[60px] min-h-screen">
        <div className="animate-fadeUp animate-fadeUp-1 text-[10px] tracking-[5px] text-gold uppercase mb-6">
          academy.thelandlord.tn
        </div>
        <div className="animate-fadeUp animate-fadeUp-2 font-serif font-light italic text-cream mb-2" style={{ fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1.05 }}>
          Certification<br />
          <span className="text-gold not-italic">Franchisé</span>
        </div>
        <div className="animate-fadeUp animate-fadeUp-3 text-[13px] tracking-[4px] text-grey-light uppercase mb-[60px]">
          Manuel Franchise TLL — Édition 2026
        </div>
        <div className="animate-fadeUp animate-fadeUp-4 w-[60px] h-[1px] bg-gold mx-auto mb-10" />
        <p className="animate-fadeUp animate-fadeUp-4 max-w-[560px] text-[14px] leading-[1.9] text-grey-light mb-14">
          Ce programme de certification valide votre maîtrise du Manuel de
          Franchise TLL. Chaque session couvre une partie du manuel. Un score
          minimum de <strong className="text-gold">80%</strong> est requis pour
          valider chaque session et accéder à la suivante.
        </p>
        <div className="animate-fadeUp animate-fadeUp-5 grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-w-[780px] w-full mb-14">
          {SESSIONS.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              index={i}
              score={scores[i]}
              locked={!isUnlocked(i)}
              onClick={() => router.push(`/quiz/${i}`)}
            />
          ))}
        </div>
        <div className="animate-fadeUp animate-fadeUp-6 flex gap-3.5 flex-wrap justify-center">
          {!allPassed && (
            <button
              className="btn-gold"
              onClick={() => router.push(`/quiz/${nextSession}`)}
            >
              Commencer la certification &nbsp;→
            </button>
          )}
          {allPassed && (
            <button
              className="btn-gold"
              onClick={() => router.push("/certificate")}
            >
              Voir mon certificat &nbsp;→
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
