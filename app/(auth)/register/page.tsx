"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, city },
      },
    });

    if (authError) {
      setError(
        authError.message === "User already registered"
          ? "Cet email est déjà utilisé. Connectez-vous."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5 py-20 relative z-[1]">
      <div className="login-box">
        <div className="text-[9px] tracking-[6px] text-gold uppercase mb-8">
          The Landlord · Academy
        </div>
        <div className="font-serif italic text-[36px] text-cream mb-2">
          Créer un compte
        </div>
        <div className="text-[11px] text-grey tracking-[1px] mb-10">
          Rejoignez la certification TLL Academy
        </div>
        <form onSubmit={handleRegister}>
          <div className="login-field">
            <label>Nom complet</label>
            <input
              type="text"
              placeholder="Votre nom et prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Ville / Pays</label>
            <input
              type="text"
              placeholder="Ex: Tunis, Casablanca, Dubai…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-green-dark font-sans text-[11px] font-medium tracking-[3px] uppercase py-4 border-none cursor-pointer mt-2 transition-all duration-300 hover:bg-gold-light disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        {error && (
          <div className="text-wrong text-[11px] mt-3">{error}</div>
        )}
        <div className="text-[11px] text-grey mt-6">
          Déjà inscrit ?{" "}
          <a
            className="text-gold cursor-pointer underline"
            onClick={() => router.push("/login")}
          >
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
