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

interface DbSession {
  id: number;
  sort_order: number;
  label: string;
  title: string;
  chapters: string;
}

interface DbQuestion {
  id: number;
  session_id: number;
  sort_order: number;
  context: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

type Tab = "users" | "sessions";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", city: "" });
  const [confirmEmail, setConfirmEmail] = useState(true);
  const [userError, setUserError] = useState("");
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Sessions state
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({ label: "", title: "", chapters: "" });
  const [questionForm, setQuestionForm] = useState({
    context: "", text: "", options: ["", "", "", ""], correct: 0, explanation: "",
  });
  const [addingSession, setAddingSession] = useState(false);
  const [addingQuestionTo, setAddingQuestionTo] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragType, setDragType] = useState<"session" | "question" | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (!authLoading && profile && !profile.is_admin) router.push("/dashboard");
    else if (!authLoading && profile?.is_admin) loadAll();
  }, [authLoading, user, profile]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadSessions()]);
    setLoading(false);
  };

  // ─── Users ──────────────────────────────────────────────

  const loadUsers = async () => {
    const { data: allProfiles } = await supabase
      .from("profiles").select("*").order("created_at", { ascending: false });
    const { data: allResults } = await supabase
      .from("session_results").select("*").order("completed_at", { ascending: false });
    if (allProfiles) {
      setUsers(allProfiles.map((p) => ({
        profile: p,
        results: (allResults || []).filter((r) => r.user_id === p.id),
      })));
    }
  };

  const createUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      setUserError("Nom, email et mot de passe sont obligatoires.");
      return;
    }
    if (userForm.password.length < 6) {
      setUserError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSaving(true);
    setUserError("");

    const { error } = await supabase.rpc("admin_create_user", {
      p_email: userForm.email,
      p_password: userForm.password,
      p_name: userForm.name,
      p_city: userForm.city || "",
      p_confirm_email: confirmEmail,
    });

    if (error) {
      setUserError(
        error.message.includes("Email already registered")
          ? "Cet email est déjà utilisé."
          : error.message
      );
      setSaving(false);
      return;
    }

    await loadUsers();
    setAddingUser(false);
    setUserForm({ name: "", email: "", password: "", city: "" });
    setConfirmEmail(true);
    setSaving(false);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (userId === user?.id) return;
    if (!confirm(`Supprimer ${email} et toutes ses données ?`)) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
    if (error) {
      console.error("admin_delete_user error:", error);
      alert("Erreur suppression: " + error.message);
    }
    await loadUsers();
    setSaving(false);
  };

  const resetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_reset_password", {
      p_user_id: userId,
      p_new_password: newPassword,
    });
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Mot de passe mis à jour.");
    }
    setResetUserId(null);
    setNewPassword("");
    setSaving(false);
  };

  const sendResetEmail = async (email: string) => {
    if (!confirm(`Envoyer un lien de connexion à ${email} ?`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://academy.thelandlord.tn/dashboard",
    });
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert(`Lien envoyé à ${email}. Ne cliquez pas vous-même sur le lien, il est destiné à l'utilisateur.`);
    }
  };

  const getBestScores = (results: SessionResult[]) => {
    const best: (SessionResult | null)[] = new Array(sessions.length).fill(null);
    const byDbId = new Map<number, SessionResult>();
    for (const r of results) {
      const dbId = r.session_id;
      if (!dbId) continue;
      const existing = byDbId.get(dbId);
      if (!existing || r.score / r.total > existing.score / existing.total)
        byDbId.set(dbId, r);
    }
    for (let i = 0; i < sessions.length; i++) {
      best[i] = byDbId.get(sessions[i].id) || null;
    }
    return best;
  };

  const getAttemptCounts = (results: SessionResult[]) => {
    const counts = new Array(sessions.length).fill(0);
    const dbIdToIdx = new Map(sessions.map((s, i) => [s.id, i]));
    for (const r of results) {
      const idx = dbIdToIdx.get(r.session_id);
      if (idx !== undefined) counts[idx]++;
    }
    return counts;
  };

  const getGlobalScore = (results: SessionResult[]) => {
    const best = getBestScores(results);
    let totalScore = 0, totalQuestions = 0;
    for (const r of best) {
      if (r) { totalScore += r.score; totalQuestions += r.total; }
    }
    return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  };

  const getStatus = (p: Profile, results: SessionResult[]) => {
    if (p.certified) return "certified";
    if (results.length > 0) return "progress";
    return "new";
  };

  const getLastActivity = (results: SessionResult[]) => {
    if (results.length === 0) return "—";
    const latest = results.reduce((a, b) =>
      new Date(a.completed_at) > new Date(b.completed_at) ? a : b);
    return new Date(latest.completed_at).toLocaleDateString("fr-FR");
  };

  const exportCSV = () => {
    const headers = ["Nom","Email","Ville","Inscrit le","S1 Score","S1 Tentatives","S2 Score","S2 Tentatives","S3 Score","S3 Tentatives","S4 Score","S4 Tentatives","Total tentatives","Score global","Statut","Dernière activité"];
    const rows = users.map((u) => {
      const best = getBestScores(u.results);
      const attempts = getAttemptCounts(u.results);
      return [
        u.profile.name, u.profile.email, u.profile.city || "",
        new Date(u.profile.created_at).toLocaleDateString("fr-FR"),
        ...best.flatMap((r, i) => [
          r ? `${Math.round((r.score / r.total) * 100)}%` : "—",
          attempts[i].toString(),
        ]),
        u.results.length.toString(), `${getGlobalScore(u.results)}%`,
        getStatus(u.profile, u.results) === "certified" ? "Certifié" : getStatus(u.profile, u.results) === "progress" ? "En cours" : "Nouveau",
        getLastActivity(u.results),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tll-academy-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Sessions CRUD ──────────────────────────────────────

  const loadSessions = async () => {
    const { data: s } = await supabase.from("sessions").select("*").order("sort_order");
    const { data: q } = await supabase.from("questions").select("*").order("sort_order");
    if (s) setSessions(s);
    if (q) setQuestions(q);
  };

  const startEditSession = (s: DbSession) => {
    setEditingSession(s.id);
    setSessionForm({ label: s.label, title: s.title, chapters: s.chapters });
  };

  const saveSession = async (id: number) => {
    setSaving(true);
    await supabase.from("sessions").update(sessionForm).eq("id", id);
    await loadSessions();
    setEditingSession(null);
    setSaving(false);
  };

  const startAddSession = () => {
    setAddingSession(true);
    setSessionForm({ label: "", title: "", chapters: "" });
  };

  const addSession = async () => {
    setSaving(true);
    const maxOrder = sessions.length > 0 ? Math.max(...sessions.map((s) => s.sort_order)) : -1;
    await supabase.from("sessions").insert({
      sort_order: maxOrder + 1,
      label: sessionForm.label,
      title: sessionForm.title,
      chapters: sessionForm.chapters,
    });
    await loadSessions();
    setAddingSession(false);
    setSaving(false);
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Supprimer cette session, ses questions et tous les résultats associés ?")) return;
    setSaving(true);
    // Delete related session_results first (FK without CASCADE)
    await supabase.from("session_results").delete().eq("session_id", id);
    await supabase.from("sessions").delete().eq("id", id);
    await Promise.all([loadSessions(), loadUsers()]);
    setSaving(false);
  };

  const startEditQuestion = (q: DbQuestion) => {
    setEditingQuestion(q.id);
    setQuestionForm({
      context: q.context,
      text: q.text,
      options: [...q.options],
      correct: q.correct,
      explanation: q.explanation,
    });
  };

  const saveQuestion = async (id: number) => {
    setSaving(true);
    await supabase.from("questions").update({
      context: questionForm.context,
      text: questionForm.text,
      options: questionForm.options,
      correct: questionForm.correct,
      explanation: questionForm.explanation,
    }).eq("id", id);
    await loadSessions();
    setEditingQuestion(null);
    setSaving(false);
  };

  const startAddQuestion = (sessionId: number) => {
    setAddingQuestionTo(sessionId);
    setQuestionForm({ context: "", text: "", options: ["", "", "", ""], correct: 0, explanation: "" });
  };

  const addQuestion = async (sessionId: number) => {
    setSaving(true);
    const sessionQs = questions.filter((q) => q.session_id === sessionId);
    const maxOrder = sessionQs.length > 0 ? Math.max(...sessionQs.map((q) => q.sort_order)) : -1;
    await supabase.from("questions").insert({
      session_id: sessionId,
      sort_order: maxOrder + 1,
      context: questionForm.context,
      text: questionForm.text,
      options: questionForm.options,
      correct: questionForm.correct,
      explanation: questionForm.explanation,
    });
    await loadSessions();
    setAddingQuestionTo(null);
    setSaving(false);
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Supprimer cette question ?")) return;
    setSaving(true);
    await supabase.from("questions").delete().eq("id", id);
    await loadSessions();
    setSaving(false);
  };

  // ─── Drag & Drop / Reorder ────────────────────────────

  const onSessionDragStart = (e: React.DragEvent, id: number) => {
    setDragType("session");
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onSessionDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragType === "session" && dragId !== id) setDragOverId(id);
  };

  const onSessionDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (dragType !== "session" || dragId === null || dragId === targetId) return;
    await swapSessionOrder(dragId, targetId);
    setDragType(null); setDragId(null); setDragOverId(null);
  };

  const onQuestionDragStart = (e: React.DragEvent, id: number) => {
    setDragType("question");
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onQuestionDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragType === "question" && dragId !== id) setDragOverId(id);
  };

  const onQuestionDrop = async (e: React.DragEvent, targetId: number, sessionId: number) => {
    e.preventDefault();
    if (dragType !== "question" || dragId === null || dragId === targetId) return;
    const sQuestions = questions.filter((q) => q.session_id === sessionId);
    const dragQ = sQuestions.find((q) => q.id === dragId);
    const targetQ = sQuestions.find((q) => q.id === targetId);
    if (!dragQ || !targetQ || dragQ.session_id !== targetQ.session_id) return;
    await swapQuestionOrder(dragQ, targetQ, sQuestions);
    setDragType(null); setDragId(null); setDragOverId(null);
  };

  const onDragEnd = () => {
    setDragType(null); setDragId(null); setDragOverId(null);
  };

  const swapSessionOrder = async (fromId: number, toId: number) => {
    const from = sessions.find((s) => s.id === fromId);
    const to = sessions.find((s) => s.id === toId);
    if (!from || !to) return;
    setSaving(true);
    await Promise.all([
      supabase.from("sessions").update({ sort_order: to.sort_order }).eq("id", fromId),
      supabase.from("sessions").update({ sort_order: from.sort_order }).eq("id", toId),
    ]);
    await loadSessions();
    setSaving(false);
  };

  const moveSession = async (id: number, direction: -1 | 1) => {
    const idx = sessions.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sessions.length) return;
    await swapSessionOrder(sessions[idx].id, sessions[swapIdx].id);
  };

  const swapQuestionOrder = async (from: DbQuestion, to: DbQuestion, sQuestions: DbQuestion[]) => {
    setSaving(true);
    // Reorder: move from to to's position, shift others
    const sorted = [...sQuestions].sort((a, b) => a.sort_order - b.sort_order);
    const fromIdx = sorted.findIndex((q) => q.id === from.id);
    const toIdx = sorted.findIndex((q) => q.id === to.id);
    sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, from);
    await Promise.all(
      sorted.map((q, i) => supabase.from("questions").update({ sort_order: i }).eq("id", q.id))
    );
    await loadSessions();
    setSaving(false);
  };

  const moveQuestion = async (questionId: number, sessionId: number, direction: -1 | 1) => {
    const sQuestions = questions.filter((q) => q.session_id === sessionId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = sQuestions.findIndex((q) => q.id === questionId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sQuestions.length) return;
    await swapQuestionOrder(sQuestions[idx], sQuestions[swapIdx], sQuestions);
  };

  // ─── Stats ──────────────────────────────────────────────

  const totalUsers = users.length;
  const certifiedCount = users.filter((u) => u.profile.certified).length;
  const inProgressCount = users.filter((u) => !u.profile.certified && u.results.length > 0).length;
  const uniqueCities = new Set(users.map((u) => u.profile.city).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-[1]">
        <div className="text-grey text-sm tracking-[2px]">Chargement...</div>
      </div>
    );
  }

  const sessionQuestionsFor = (sessionId: number) =>
    questions.filter((q) => q.session_id === sessionId);

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

        {/* Tabs */}
        <div className="flex gap-0.5 mb-8">
          <button
            className={`px-6 py-2.5 text-[10px] tracking-[2px] uppercase transition-all ${
              tab === "users"
                ? "bg-gold/10 text-gold border border-gold/30"
                : "bg-white/[0.02] text-grey border border-white/5 hover:border-white/10"
            }`}
            onClick={() => setTab("users")}
          >
            Utilisateurs
          </button>
          <button
            className={`px-6 py-2.5 text-[10px] tracking-[2px] uppercase transition-all ${
              tab === "sessions"
                ? "bg-gold/10 text-gold border border-gold/30"
                : "bg-white/[0.02] text-grey border border-white/5 hover:border-white/10"
            }`}
            onClick={() => setTab("sessions")}
          >
            Sessions & Quiz
          </button>
        </div>

        {/* ═══════════════ USERS TAB ═══════════════ */}
        {tab === "users" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 mb-10">
              <div className="stat-card">
                <div className="font-serif text-[40px] text-gold">{totalUsers}</div>
                <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">Inscrits</div>
              </div>
              <div className="stat-card">
                <div className="font-serif text-[40px] text-gold">{inProgressCount}</div>
                <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1 whitespace-nowrap">En cours</div>
              </div>
              <div className="stat-card">
                <div className="font-serif text-[40px] text-gold">{certifiedCount}</div>
                <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1">Certifiés</div>
              </div>
              <div className="stat-card">
                <div className="font-serif text-[40px] text-gold">{uniqueCities || "—"}</div>
                <div className="text-[9px] tracking-[2px] text-grey uppercase mt-1 whitespace-nowrap">Marchés représentés</div>
              </div>
            </div>

            {/* Create user form */}
            {addingUser && (
              <div className="border border-gold/20 bg-white/[0.02] p-5 mb-6 space-y-3">
                <div className="text-[10px] tracking-[2px] text-gold uppercase mb-2">
                  Créer un utilisateur
                </div>
                <input
                  className="admin-input w-full"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Nom complet *"
                />
                <input
                  className="admin-input w-full"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Email *"
                />
                <input
                  className="admin-input w-full"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mot de passe * (min 6 caractères)"
                />
                <input
                  className="admin-input w-full"
                  value={userForm.city}
                  onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                  placeholder="Ville / Pays (optionnel)"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.checked)}
                    className="accent-[var(--gold)]"
                  />
                  <span className="text-[11px] text-grey">Email confirmé automatiquement (pas de vérification requise)</span>
                </label>
                {userError && (
                  <div className="text-wrong text-[11px]">{userError}</div>
                )}
                <div className="flex gap-2">
                  <button className="btn-sm btn-sm-gold" onClick={createUser} disabled={saving}>
                    {saving ? "..." : "Créer"}
                  </button>
                  <button className="btn-sm btn-sm-ghost" onClick={() => { setAddingUser(false); setUserError(""); }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button className="btn-export" onClick={() => { setAddingUser(true); setUserForm({ name: "", email: "", password: "", city: "" }); setUserError(""); }}>
                + Créer un utilisateur
              </button>
              <button className="btn-export" onClick={exportCSV}>⬇ Exporter CSV</button>
              <button className="btn-export" onClick={loadAll}>↻ Actualiser</button>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Franchisé</th>
                    <th>Ville</th>
                    <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
                    <th>Score global</th>
                    <th>Statut</th>
                    <th>Activité</th>
                    <th>Actions</th>
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
                                  <div className={`text-[13px] font-medium ${passed ? "text-gold" : "text-wrong"}`}>{pct}%</div>
                                  <div className="text-[9px] text-grey">{attempts[i]} tent.</div>
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
                                className={`score-bar-fill ${globalScore >= 80 ? "score-bar-pass" : globalScore >= 60 ? "score-bar-partial" : "score-bar-fail"}`}
                                style={{ width: `${globalScore}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-gold whitespace-nowrap min-w-[34px]">{globalScore}%</div>
                          </div>
                        </td>
                        <td>
                          <span className={status === "certified" ? "badge-certified" : status === "progress" ? "badge-progress" : "badge-new"}>
                            {status === "certified" ? "CERTIFIÉ" : status === "progress" ? "EN COURS" : "NOUVEAU"}
                          </span>
                        </td>
                        <td>
                          <div className="text-[11px]">{getLastActivity(u.results)}</div>
                          <div className="text-[9px] text-grey mt-0.5">{u.results.length} tent. total</div>
                        </td>
                        <td>
                          {resetUserId === u.profile.id ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                className="admin-input w-full text-[11px]"
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nouveau mot de passe"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  className="btn-sm btn-sm-gold"
                                  onClick={() => resetPassword(u.profile.id)}
                                  disabled={saving}
                                >
                                  {saving ? "..." : "OK"}
                                </button>
                                <button
                                  className="btn-sm btn-sm-ghost"
                                  onClick={() => sendResetEmail(u.profile.email)}
                                  disabled={saving}
                                  title="Envoyer un lien par email"
                                >
                                  Email
                                </button>
                                <button
                                  className="btn-sm btn-sm-ghost"
                                  onClick={() => { setResetUserId(null); setNewPassword(""); }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                className="btn-sm btn-sm-ghost"
                                onClick={() => { setResetUserId(u.profile.id); setNewPassword(""); }}
                                disabled={saving}
                              >
                                Mdp
                              </button>
                              {u.profile.id !== user?.id && (
                                <button
                                  className="btn-sm btn-sm-danger"
                                  onClick={() => deleteUser(u.profile.id, u.profile.email)}
                                  disabled={saving}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center text-grey py-[60px] text-[13px]">Aucun inscrit pour le moment.</div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ SESSIONS TAB ═══════════════ */}
        {tab === "sessions" && (
          <div className="space-y-4">
            {sessions.length === 0 && (
              <div className="text-center text-grey py-[60px] text-[13px]">
                Aucune session trouvée. Exécutez le script SQL sessions-schema.sql dans Supabase.
              </div>
            )}

            {sessions.map((s, si) => {
              const sQuestions = sessionQuestionsFor(s.id);
              const isExpanded = expandedSession === s.id;
              const isEditing = editingSession === s.id;
              const isDragOver = dragType === "session" && dragOverId === s.id;

              return (
                <div
                  key={s.id}
                  className={`border bg-white/[0.02] transition-colors ${isDragOver ? "border-gold/40" : "border-white/5"}`}
                  draggable
                  onDragStart={(e) => onSessionDragStart(e, s.id)}
                  onDragOver={(e) => onSessionDragOver(e, s.id)}
                  onDrop={(e) => onSessionDrop(e, s.id)}
                  onDragEnd={onDragEnd}
                >
                  {/* Session header */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    {/* Drag handle + arrows */}
                    <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
                      <button
                        className="text-grey/40 hover:text-gold text-[14px] leading-none disabled:opacity-20 disabled:cursor-not-allowed"
                        onClick={() => moveSession(s.id, -1)}
                        disabled={si === 0 || saving}
                        title="Monter"
                      >▲</button>
                      <div className="text-grey/30 text-[16px] leading-none select-none" title="Glisser pour réordonner">⠿</div>
                      <button
                        className="text-grey/40 hover:text-gold text-[14px] leading-none disabled:opacity-20 disabled:cursor-not-allowed"
                        onClick={() => moveSession(s.id, 1)}
                        disabled={si === sessions.length - 1 || saving}
                        title="Descendre"
                      >▼</button>
                    </div>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            className="admin-input w-full"
                            value={sessionForm.label}
                            onChange={(e) => setSessionForm({ ...sessionForm, label: e.target.value })}
                            placeholder="Label (ex: Session 1 · Chapitres 1–8)"
                          />
                          <input
                            className="admin-input w-full"
                            value={sessionForm.title}
                            onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                            placeholder="Titre (ex: Opérations Fondamentales)"
                          />
                          <input
                            className="admin-input w-full"
                            value={sessionForm.chapters}
                            onChange={(e) => setSessionForm({ ...sessionForm, chapters: e.target.value })}
                            placeholder="Chapitres"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-[9px] tracking-[3px] text-gold uppercase mb-1">{s.label}</div>
                          <div className="font-serif text-[22px] text-cream">{s.title}</div>
                          <div className="text-[11px] text-grey mt-1">{s.chapters}</div>
                          <div className="text-[10px] text-gold/60 mt-2">
                            {sQuestions.length} question{sQuestions.length !== 1 ? "s" : ""} · Cliquer pour {isExpanded ? "réduire" : "développer"}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button className="btn-sm btn-sm-gold" onClick={() => saveSession(s.id)} disabled={saving}>
                            {saving ? "..." : "Sauvegarder"}
                          </button>
                          <button className="btn-sm btn-sm-ghost" onClick={() => setEditingSession(null)}>
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-sm btn-sm-ghost" onClick={() => startEditSession(s)}>
                            Modifier
                          </button>
                          <button className="btn-sm btn-sm-danger" onClick={() => deleteSession(s.id)}>
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Questions list */}
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {sQuestions.map((q, qi) => {
                        const isEditingQ = editingQuestion === q.id;
                        const isQDragOver = dragType === "question" && dragOverId === q.id;
                        return (
                          <div
                            key={q.id}
                            className={`p-4 border-b last:border-b-0 transition-colors ${isQDragOver ? "border-gold/40 bg-gold/[0.03]" : "border-white/[0.03]"}`}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); onQuestionDragStart(e, q.id); }}
                            onDragOver={(e) => { e.stopPropagation(); onQuestionDragOver(e, q.id); }}
                            onDrop={(e) => { e.stopPropagation(); onQuestionDrop(e, q.id, s.id); }}
                            onDragEnd={onDragEnd}
                          >
                            {isEditingQ ? (
                              <div className="space-y-3">
                                <input
                                  className="admin-input w-full"
                                  value={questionForm.context}
                                  onChange={(e) => setQuestionForm({ ...questionForm, context: e.target.value })}
                                  placeholder="Contexte (ex: Chapitre 01 — Philosophie)"
                                />
                                <textarea
                                  className="admin-input w-full min-h-[60px]"
                                  value={questionForm.text}
                                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                                  placeholder="Question"
                                />
                                {questionForm.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${q.id}`}
                                      checked={questionForm.correct === oi}
                                      onChange={() => setQuestionForm({ ...questionForm, correct: oi })}
                                      className="accent-[var(--gold)]"
                                    />
                                    <input
                                      className="admin-input flex-1"
                                      value={opt}
                                      onChange={(e) => {
                                        const opts = [...questionForm.options];
                                        opts[oi] = e.target.value;
                                        setQuestionForm({ ...questionForm, options: opts });
                                      }}
                                      placeholder={`Option ${oi + 1}`}
                                    />
                                  </div>
                                ))}
                                <button
                                  className="text-[10px] text-gold/60 hover:text-gold"
                                  onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ""] })}
                                >
                                  + Ajouter une option
                                </button>
                                <textarea
                                  className="admin-input w-full min-h-[40px]"
                                  value={questionForm.explanation}
                                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                  placeholder="Explication"
                                />
                                <div className="flex gap-2">
                                  <button className="btn-sm btn-sm-gold" onClick={() => saveQuestion(q.id)} disabled={saving}>
                                    {saving ? "..." : "Sauvegarder"}
                                  </button>
                                  <button className="btn-sm btn-sm-ghost" onClick={() => setEditingQuestion(null)}>
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                {/* Question drag handle + arrows */}
                                <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing">
                                  <button
                                    className="text-grey/40 hover:text-gold text-[10px] leading-none disabled:opacity-20"
                                    onClick={() => moveQuestion(q.id, s.id, -1)}
                                    disabled={qi === 0 || saving}
                                  >▲</button>
                                  <div className="text-grey/25 text-[12px] leading-none select-none">⠿</div>
                                  <button
                                    className="text-grey/40 hover:text-gold text-[10px] leading-none disabled:opacity-20"
                                    onClick={() => moveQuestion(q.id, s.id, 1)}
                                    disabled={qi === sQuestions.length - 1 || saving}
                                  >▼</button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] tracking-[2px] text-gold/50 uppercase mb-1">
                                    Q{qi + 1} · {q.context}
                                  </div>
                                  <div className="text-[13px] text-cream mb-1.5">{q.text}</div>
                                  <div className="space-y-0.5">
                                    {q.options.map((opt: string, oi: number) => (
                                      <div
                                        key={oi}
                                        className={`text-[11px] ${oi === q.correct ? "text-gold" : "text-grey"}`}
                                      >
                                        {oi === q.correct ? "✓ " : "  "}{opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button className="btn-sm btn-sm-ghost" onClick={() => startEditQuestion(q)}>
                                    Modifier
                                  </button>
                                  <button className="btn-sm btn-sm-danger" onClick={() => deleteQuestion(q.id)}>
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add question form */}
                      {addingQuestionTo === s.id ? (
                        <div className="p-4 border-t border-white/5 space-y-3">
                          <div className="text-[10px] tracking-[2px] text-gold uppercase mb-2">
                            Nouvelle question
                          </div>
                          <input
                            className="admin-input w-full"
                            value={questionForm.context}
                            onChange={(e) => setQuestionForm({ ...questionForm, context: e.target.value })}
                            placeholder="Contexte (ex: Chapitre 01 — Philosophie)"
                          />
                          <textarea
                            className="admin-input w-full min-h-[60px]"
                            value={questionForm.text}
                            onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                            placeholder="Question"
                          />
                          {questionForm.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correct-new"
                                checked={questionForm.correct === oi}
                                onChange={() => setQuestionForm({ ...questionForm, correct: oi })}
                                className="accent-[var(--gold)]"
                              />
                              <input
                                className="admin-input flex-1"
                                value={opt}
                                onChange={(e) => {
                                  const opts = [...questionForm.options];
                                  opts[oi] = e.target.value;
                                  setQuestionForm({ ...questionForm, options: opts });
                                }}
                                placeholder={`Option ${oi + 1}`}
                              />
                            </div>
                          ))}
                          <button
                            className="text-[10px] text-gold/60 hover:text-gold"
                            onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ""] })}
                          >
                            + Ajouter une option
                          </button>
                          <textarea
                            className="admin-input w-full min-h-[40px]"
                            value={questionForm.explanation}
                            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                            placeholder="Explication"
                          />
                          <div className="flex gap-2">
                            <button className="btn-sm btn-sm-gold" onClick={() => addQuestion(s.id)} disabled={saving}>
                              {saving ? "..." : "Ajouter"}
                            </button>
                            <button className="btn-sm btn-sm-ghost" onClick={() => setAddingQuestionTo(null)}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-t border-white/5">
                          <button
                            className="btn-sm btn-sm-gold"
                            onClick={() => startAddQuestion(s.id)}
                          >
                            + Ajouter une question
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add session */}
            {addingSession ? (
              <div className="border border-gold/20 bg-white/[0.02] p-5 space-y-3">
                <div className="text-[10px] tracking-[2px] text-gold uppercase mb-2">
                  Nouvelle session
                </div>
                <input
                  className="admin-input w-full"
                  value={sessionForm.label}
                  onChange={(e) => setSessionForm({ ...sessionForm, label: e.target.value })}
                  placeholder="Label (ex: Session 5 · Chapitres 30–35)"
                />
                <input
                  className="admin-input w-full"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  placeholder="Titre"
                />
                <input
                  className="admin-input w-full"
                  value={sessionForm.chapters}
                  onChange={(e) => setSessionForm({ ...sessionForm, chapters: e.target.value })}
                  placeholder="Chapitres"
                />
                <div className="flex gap-2">
                  <button className="btn-sm btn-sm-gold" onClick={addSession} disabled={saving}>
                    {saving ? "..." : "Créer la session"}
                  </button>
                  <button className="btn-sm btn-sm-ghost" onClick={() => setAddingSession(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-gold w-full" onClick={startAddSession}>
                + Ajouter une session
              </button>
            )}
          </div>
        )}

        <div className="mt-8">
          <button className="btn-ghost" onClick={() => router.push("/dashboard")}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
}
