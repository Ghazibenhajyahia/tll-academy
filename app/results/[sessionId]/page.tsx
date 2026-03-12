import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export function generateStaticParams() {
  return [
    { sessionId: "0" },
    { sessionId: "1" },
    { sessionId: "2" },
    { sessionId: "3" },
  ];
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsClient />
    </Suspense>
  );
}
