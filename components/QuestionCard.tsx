"use client";

import { useState } from "react";
import type { Question } from "@/types";
import OptionButton from "./OptionButton";

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}

const LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  questionIndex,
  onAnswer,
  onNext,
  isLast,
}: QuestionCardProps) {
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setAnswered(true);
    setChosen(idx);
    onAnswer(idx === question.correct);
  };

  const getOptionState = (idx: number) => {
    if (!answered) return "default" as const;
    if (idx === question.correct) return "correct" as const;
    if (idx === chosen && chosen !== question.correct) return "wrong" as const;
    return "neutral" as const;
  };

  return (
    <div
      key={questionIndex}
      className="question-card"
      style={{
        animation: "fadeUp 0.35s ease forwards",
      }}
    >
      <div className="text-[9px] tracking-[3px] text-gold uppercase mb-4">
        {question.context}
      </div>
      <div className="font-serif text-[22px] font-normal leading-[1.5] text-cream mb-8">
        {question.text}
      </div>
      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <OptionButton
            key={i}
            letter={LETTERS[i]}
            text={opt}
            state={getOptionState(i)}
            disabled={answered}
            onClick={() => handleAnswer(i)}
          />
        ))}
      </div>
      {answered && (
        <div className="explanation-box mt-4">
          {question.explanation}
        </div>
      )}
      <div className="flex justify-between items-center mt-8">
        <div className="text-[11px] tracking-[1px] text-grey" />
        {answered && (
          <button className="btn-outline" onClick={onNext}>
            {isLast ? "Voir mes résultats →" : "Question suivante →"}
          </button>
        )}
      </div>
    </div>
  );
}
