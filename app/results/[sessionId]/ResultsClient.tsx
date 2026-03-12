"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { SESSIONS } from "@/lib/questions";
import TopBar from "@/components/TopBar";
import ResultRing from "@/components/ResultRing";

export default function ResultsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionIndex = Number(params.sessionId);
  const session = SESSIONS[sessionIndex];

  const score = Number(searchParams.get("score") || 0);
  const total = Number(searchParams.get("total") || session?.questions.length || 12);
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 80;

  if (!session) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="relative z-[1]">
      <TopBar />
      <div className="flex flex-col items-center justify-center min-h-screen px-5 py-20 text-center">
        <div className="text-[9px] tracking-[5px] text-gold uppercase mb-6">
          {session.label}
        </div>

        <ResultRing percentage={pct} />

        <div
          className="font-serif font-light italic text-cream mb-3"
          style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
        >
          {passed ? "Session validée" : "Session non validée"}
        </div>

        <div className="text-[13px] text-grey-light leading-[1.8] max-w-[440px] mx-auto mb-10">
          {passed
            ? `Félicitations — vous avez obtenu ${pct}% sur cette session.`
            : `Vous avez obtenu ${pct}%. Un minimum de 80% est requis pour valider cette session. Réessayez !`}
        </div>

        <div className="flex gap-10 justify-center mb-12">
          <div className="text-center">
            <div className="font-serif text-[36px] text-gold">{score}</div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">
              Bonnes réponses
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-[36px] text-gold">{total - score}</div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">
              Erreurs
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-[36px] text-gold">{pct}%</div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">
              Score final
            </div>
          </div>
        </div>

        <div className="flex gap-3.5 justify-center flex-wrap">
          <button
            className="btn-outline"
            onClick={() => router.push(`/quiz/${sessionIndex}`)}
          >
            ↩ Recommencer
          </button>
          {passed && sessionIndex < 3 && (
            <button
              className="btn-gold"
              onClick={() => router.push(`/quiz/${sessionIndex + 1}`)}
            >
              Session suivante →
            </button>
          )}
          {passed && sessionIndex === 3 && (
            <button
              className="btn-gold"
              onClick={() => router.push("/certificate")}
            >
              Voir mon certificat →
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() => router.push("/dashboard")}
          >
            ← Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
