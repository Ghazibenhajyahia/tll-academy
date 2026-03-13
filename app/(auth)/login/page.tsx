"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
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
        <img src="/logo-blanc.png" alt="The Landlord" className="h-12 mx-auto mb-6" />
        <div className="text-[9px] tracking-[6px] text-gold uppercase mb-8">
          The Landlord · Academy
        </div>
        <div className="font-serif italic text-[36px] text-cream mb-2">
          Bienvenue
        </div>
        <div className="text-[11px] text-grey tracking-[1px] mb-10">
          Connectez-vous pour accéder à la certification
        </div>
        <form onSubmit={handleLogin}>
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
            {loading ? "Connexion..." : "Connexion"}
          </button>
        </form>
        {error && (
          <div className="text-wrong text-[11px] mt-3">{error}</div>
        )}
{/* Registration link hidden for now
        <div className="text-[11px] text-grey mt-6">
          Pas encore de compte ?{" "}
          <a
            className="text-gold cursor-pointer underline"
            onClick={() => router.push("/register")}
          >
            Créer un compte
          </a>
        </div>
*/}
      </div>
    </div>
  );
}
