"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { fetchSessions } from "@/lib/sessions";
import TopBar from "@/components/TopBar";
import SessionCard from "@/components/SessionCard";
import type { Session, SessionScore } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scores, setScores] = useState<(SessionScore | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    init();
  }, [authLoading, user]);

  const init = async () => {
    const [sessionsData] = await Promise.all([fetchSessions()]);
    setSessions(sessionsData);

    if (!user) return;
    const { data: results } = await supabase
      .from("session_results")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (results) {
      // Map results by session DB id, then align to position
      const bestScores: (SessionScore | null)[] = new Array(sessionsData.length).fill(null);
      const byDbId = new Map<number, { score: number; total: number }>();
      for (const r of results) {
        const dbId = r.session_id ?? null;
        if (dbId === null) continue;
        const existing = byDbId.get(dbId);
        if (!existing || r.score / r.total > existing.score / existing.total) {
          byDbId.set(dbId, { score: r.score, total: r.total });
        }
      }
      for (let i = 0; i < sessionsData.length; i++) {
        const best = byDbId.get(sessionsData[i].dbId);
        if (best) {
          bestScores[i] = { ...best, passed: best.score / best.total >= 0.8 };
        }
      }
      setScores(bestScores);
    }
    setReady(true);
  };

  const allPassed = sessions.length > 0 && scores.every((s) => s?.passed);
  const firstAvailable = scores.findIndex((s) => !s || !s.passed);
  const nextSession = firstAvailable >= 0 ? firstAvailable : 0;

  const isUnlocked = (idx: number) => {
    // Already passed sessions are always accessible (even after reorder)
    if (scores[idx]?.passed) return true;
    if (idx === 0) return true;
    // For unpassed sessions, all previous must be passed
    for (let i = 0; i < idx; i++) {
      if (!scores[i]?.passed) return false;
    }
    return true;
  };

  if (authLoading || !ready) {
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
          {sessions.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              index={i}
              score={scores[i] || null}
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
