"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TopBar from "@/components/TopBar";
import CertificateView from "@/components/CertificateView";

export default function CertificatePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && profile && !profile.certified) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
  }

  const certDate = profile?.certified_at
    ? new Date(profile.certified_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="relative z-[1]">
      <TopBar />
      <div className="flex flex-col items-center justify-center min-h-screen px-5 py-20 text-center">
        <CertificateView
          userName={profile?.name || "Franchisé TLL"}
          date={`Certifié le ${certDate}`}
        />
        <div className="mt-10 flex gap-3.5 flex-wrap justify-center">
          <button
            className="btn-ghost"
            onClick={() => router.push("/dashboard")}
          >
            ← Retour à l&apos;accueil
          </button>
          <button className="btn-gold" onClick={() => window.print()}>
            Imprimer le certificat
          </button>
        </div>
      </div>
    </div>
  );
}
