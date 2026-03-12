"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = (current / total) * 100;

  return (
    <div className="flex items-center gap-3.5">
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] tracking-[1px] text-grey whitespace-nowrap min-w-[60px] text-right">
        {current} / {total}
      </div>
    </div>
  );
}
