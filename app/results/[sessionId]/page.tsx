import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ sessionId: String(i) }));
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsClient />
    </Suspense>
  );
}
