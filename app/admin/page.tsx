"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import TopBar from "@/components/TopBar";
import type { Profile, SessionResult } from "@/types";

interface UserRow {
  profile: Profile;
  results: SessionResult[];
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && profile && !profile.is_admin) {
      router.push("/dashboard");
    } else if (!authLoading && profile?.is_admin) {
      loadAdmin();
    }
  }, [authLoading, user, profile]);

  const loadAdmin = async () => {
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: allResults } = await supabase
      .from("session_results")
      .select("*")
      .order("completed_at", { ascending: false });

    if (allProfiles) {
      const rows: UserRow[] = allProfiles.map((p) => ({
        profile: p,
        results: (allResults || []).filter((r) => r.user_id === p.id),
      }));
      setUsers(rows);
    }

    setLoading(false);
  };

  const getBestScores = (results: SessionResult[]) => {
    const best: (SessionResult | null)[] = [null, null, null, null];
    for (const r of results) {
      const idx = r.session_index;
      if (
        !best[idx] ||
        r.score / r.total > best[idx]!.score / best[idx]!.total
      ) {
        best[idx] = r;
      }
    }
    return best;
  };

  const getAttemptCounts = (results: SessionResult[]) => {
    const counts = [0, 0, 0, 0];
    for (const r of results) {
      counts[r.session_index]++;
    }
    return counts;
  };

  const getGlobalScore = (results: SessionResult[]) => {
    const best = getBestScores(results);
    let totalScore = 0;
    let totalQuestions = 0;
    for (const r of best) {
      if (r) {
        totalScore += r.score;
        totalQuestions += r.total;
      }
    }
    return totalQuestions > 0
      ? Math.round((totalScore / totalQuestions) * 100)
      : 0;
  };

  const getStatus = (profile: Profile, results: SessionResult[]) => {
    if (profile.certified) return "certified";
    if (results.length > 0) return "progress";
    return "new";
  };

  const getLastActivity = (results: SessionResult[]) => {
    if (results.length === 0) return "—";
    const latest = results.reduce((a, b) =>
      new Date(a.completed_at) > new Date(b.completed_at) ? a : b,
    );
    return new Date(latest.completed_at).toLocaleDateString("fr-FR");
  };

  const exportCSV = () => {
    const headers = [
      "Nom",
      "Email",
      "Ville",
      "Inscrit le",
      "S1 Score",
      "S1 Tentatives",
      "S2 Score",
      "S2 Tentatives",
      "S3 Score",
      "S3 Tentatives",
      "S4 Score",
      "S4 Tentatives",
      "Total tentatives",
      "Score global",
      "Statut",
      "Dernière activité",
    ];
    const rows = users.map((u) => {
      const best = getBestScores(u.results);
      const attempts = getAttemptCounts(u.results);
      const globalScore = getGlobalScore(u.results);
      const status = getStatus(u.profile, u.results);
      return [
        u.profile.name,
        u.profile.email,
        u.profile.city || "",
        new Date(u.profile.created_at).toLocaleDateString("fr-FR"),
        ...best.flatMap((r, i) => [
          r ? `${Math.round((r.score / r.total) * 100)}%` : "—",
          attempts[i].toString(),
        ]),
        u.results.length.toString(),
        `${globalScore}%`,
        status === "certified"
          ? "Certifié"
          : status === "progress"
            ? "En cours"
            : "Nouveau",
        getLastActivity(u.results),
      ];
    });
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tll-academy-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalUsers = users.length;
  const certifiedCount = users.filter((u) => u.profile.certified).length;
  const inProgressCount = users.filter(
    (u) => !u.profile.certified && u.results.length > 0,
  ).length;
  const uniqueCities = new Set(users.map((u) => u.profile.city).filter(Boolean))
    .size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="relative z-[1]">
      <TopBar />
      <div className="pt-16 w-full max-w-[1100px] px-5 py-12 mx-auto">
        <div className="mb-10 pt-5">
          <div className="text-[9px] tracking-[4px] text-gold uppercase mb-3">
            The Landlord · Academy
          </div>
          <div className="font-serif text-[40px] font-light italic text-cream mb-2">
            Tableau de bord
          </div>
          <div className="text-[12px] text-grey">
            {totalUsers} candidat{totalUsers !== 1 ? "s" : ""} inscrit
            {totalUsers !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 mb-10">
          <div className="stat-card">
            <div className="font-serif text-[40px] text-gold">{totalUsers}</div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">
              Inscrits
            </div>
          </div>
          <div className="stat-card">
            <div className="font-serif text-[40px] text-gold">
              {inProgressCount}
            </div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1 whitespace-nowrap">
              En cours
            </div>
          </div>
          <div className="stat-card">
            <div className="font-serif text-[40px] text-gold">
              {certifiedCount}
            </div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">
              Certifiés
            </div>
          </div>
          <div className="stat-card">
            <div className="font-serif text-[40px] text-gold">
              {uniqueCities || "—"}
            </div>
            <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1 whitespace-nowrap">
              Marchés représentés
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button className="btn-export" onClick={exportCSV}>
            ⬇ Exporter CSV
          </button>
          <button className="btn-export" onClick={loadAdmin}>
            ↻ Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Franchisé</th>
                <th>Ville</th>
                <th>S1</th>
                <th>S2</th>
                <th>S3</th>
                <th>S4</th>
                <th>Score global</th>
                <th>Statut</th>
                <th>Activité</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const best = getBestScores(u.results);
                const attempts = getAttemptCounts(u.results);
                const globalScore = getGlobalScore(u.results);
                const status = getStatus(u.profile, u.results);

                return (
                  <tr key={u.profile.id}>
                    <td>
                      <div className="text-cream">{u.profile.name}</div>
                      <div className="text-[10px] text-grey mt-0.5">{u.profile.email}</div>
                    </td>
                    <td>{u.profile.city || "—"}</td>
                    {best.map((r, i) => {
                      const pct = r ? Math.round((r.score / r.total) * 100) : null;
                      const passed = pct !== null && pct >= 80;
                      return (
                        <td key={i}>
                          {pct !== null ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <div className={`text-[13px] font-medium ${passed ? "text-gold" : "text-wrong"}`}>
                                {pct}%
                              </div>
                              <div className="text-[9px] text-grey">
                                {attempts[i]} tent.
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-grey-dark">—</div>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <div className="score-bar-bg">
                          <div
                            className={`score-bar-fill ${
                              globalScore >= 80
                                ? "score-bar-pass"
                                : globalScore >= 60
                                  ? "score-bar-partial"
                                  : "score-bar-fail"
                            }`}
                            style={{ width: `${globalScore}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-gold whitespace-nowrap min-w-[34px]">
                          {globalScore}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          status === "certified"
                            ? "badge-certified"
                            : status === "progress"
                              ? "badge-progress"
                              : "badge-new"
                        }
                      >
                        {status === "certified"
                          ? "CERTIFIÉ"
                          : status === "progress"
                            ? "EN COURS"
                            : "NOUVEAU"}
                      </span>
                    </td>
                    <td>
                      <div className="text-[11px]">{getLastActivity(u.results)}</div>
                      <div className="text-[9px] text-grey mt-0.5">
                        {u.results.length} tent. total
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center text-grey py-[60px] text-[13px]">
              Aucun inscrit pour le moment.
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            className="btn-ghost"
            onClick={() => router.push("/dashboard")}
          >
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
}
