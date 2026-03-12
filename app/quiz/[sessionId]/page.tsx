import QuizClient from "./QuizClient";

export function generateStaticParams() {
  return [
    { sessionId: "0" },
    { sessionId: "1" },
    { sessionId: "2" },
    { sessionId: "3" },
  ];
}

export default function QuizPage() {
  return <QuizClient />;
}
