"use client";

interface OptionButtonProps {
  letter: string;
  text: string;
  state: "default" | "correct" | "wrong" | "neutral";
  disabled: boolean;
  onClick: () => void;
}

export default function OptionButton({
  letter,
  text,
  state,
  disabled,
  onClick,
}: OptionButtonProps) {
  const stateClass =
    state === "correct" ? "correct" : state === "wrong" ? "wrong" : "";

  return (
    <button
      className={`option-btn ${stateClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="option-letter">{letter}</span>
      <span>{text}</span>
    </button>
  );
}
