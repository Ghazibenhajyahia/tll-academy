"use client";

import { useEffect, useState } from "react";

interface ResultRingProps {
  percentage: number;
}

export default function ResultRing({ percentage }: ResultRingProps) {
  const [offset, setOffset] = useState(427);
  const circumference = 2 * Math.PI * 68; // ~427

  const ringClass =
    percentage >= 80 ? "ring-pass" : percentage >= 60 ? "ring-partial" : "ring-fail";

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (circumference * percentage) / 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="relative w-[160px] h-[160px] mx-auto mb-8">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle className="ring-bg" cx="80" cy="80" r="68" />
        <circle
          className={`ring-fill ${ringClass}`}
          cx="80"
          cy="80"
          r="68"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-serif text-[42px] font-light text-cream">
        {percentage}%
      </div>
    </div>
  );
}
