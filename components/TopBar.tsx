"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="topbar">
      <div
        className="font-serif font-light text-[11px] tracking-[6px] text-gold uppercase cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        The Landlord
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[10px] tracking-[3px] text-grey uppercase hidden sm:block">
          {title || "Academy · Certification Franchisé"}
        </div>
        {profile && (
          <div className="text-[10px] tracking-[2px] text-grey-light hidden sm:block">
            {profile.name}
          </div>
        )}
        {profile?.is_admin && (
          <button
            className="btn-topbar"
            onClick={() => router.push("/admin")}
          >
            Admin
          </button>
        )}
        {(profile || user) && (
          <button
            className="btn-topbar !text-grey !border-white/10 hover:!text-cream hover:!border-white/25"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}
