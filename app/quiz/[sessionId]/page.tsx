import QuizClient from "./QuizClient";

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ sessionId: String(i) }));
}

export default function QuizPage() {
  return <QuizClient />;
}
