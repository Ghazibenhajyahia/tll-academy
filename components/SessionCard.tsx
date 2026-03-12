"use client";

import type { Session, SessionScore } from "@/types";

interface SessionCardProps {
  session: Session;
  index: number;
  score: SessionScore | null;
  locked: boolean;
  onClick: () => void;
}

export default function SessionCard({
  session,
  index,
  score,
  locked,
  onClick,
}: SessionCardProps) {
  const passed = score?.passed ?? false;

  const statusClass = locked
    ? "status-locked"
    : passed
      ? "status-done"
      : "status-open";

  const statusText = locked
    ? "Verrouillé"
    : passed
      ? `Validé (${Math.round((score!.score / score!.total) * 100)}%)`
      : score
        ? `À repasser (${Math.round((score.score / score.total) * 100)}%)`
        : "Disponible";

  return (
    <div
      className={`session-card ${locked ? "locked" : ""} ${passed ? "completed" : ""}`}
      onClick={locked ? undefined : onClick}
    >
      <div className="text-[9px] tracking-[3px] text-gold uppercase mb-2.5">
        Session {index + 1}
      </div>
      <div className="font-serif text-[22px] font-normal text-cream mb-2 leading-tight">
        {session.title}
      </div>
      <div className="text-[11px] text-grey tracking-[0.5px] mb-4">
        {session.chapters}
      </div>
      <div className="flex items-center gap-3.5">
        <div className="text-[10px] text-gold tracking-[1px]">
          {session.questions.length} questions
        </div>
        <div className={`text-[10px] tracking-[1px] px-2.5 py-0.5 ${statusClass}`}>
          {locked ? "🔒 " : passed ? "✓ " : ""}
          {statusText}
        </div>
      </div>
    </div>
  );
}
