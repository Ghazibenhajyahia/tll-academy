"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen relative z-[1]">
      <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
    </div>
  );
}
