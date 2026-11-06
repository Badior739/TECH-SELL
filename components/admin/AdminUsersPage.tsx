"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, LoaderCircle, Shield, UserPlus, UserRoundX } from "lucide-react";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/lib/admin-roles";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  lastSignInAt: string | null;
};

async function adminRequest(path: string, init?: RequestInit) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Impossible de vérifier votre session. Reconnectez-vous.");
  if (!data.session) throw new Error("Session expirée. Reconnectez-vous.");

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error || "La requête a échoué. Réessayez.");
  }

  if (response.status === 204) return null;
  return response.json() as Promise<{ users?: AdminUser[] }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("catalog");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await adminRequest("/api/admin/users");
      setUsers(result?.users || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les comptes.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy("create");

    try {
      await adminRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
      setEmail("");
      setPassword("");
      setSuccess(`Le compte ${email} a été créé. Transmettez son mot de passe temporaire par un canal sécurisé.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La création du compte a échoué.");
    } finally {
      setBusy("");
    }
  }

  async function updateRole(user: AdminUser, nextRole: AdminRole) {
    if (user.role === nextRole) return;
    setError("");
    setSuccess("");
    setBusy(user.id);
    try {
      await adminRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      setSuccess(`Rôle mis à jour pour ${user.email}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La modification du rôle a échoué.");
    } finally {
      setBusy("");
    }
  }

  async function revokeAccess(user: AdminUser) {
    if (!window.confirm(`Révoquer l’accès à l’administration pour ${user.email} ?`)) return;
    setError("");
    setSuccess("");
    setBusy(user.id);
    try {
      await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setSuccess(`Accès administrateur révoqué pour ${user.email}. Le compte Auth n’est pas supprimé.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La révocation de l’accès a échoué.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-600">
          <Shield size={17} aria-hidden="true" />
          Accès et sécurité
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">Utilisateurs administrateurs</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Créez des comptes de l’équipe, attribuez un niveau d’accès et révoquez les accès inutiles.
        </p>
      </header>

      <section className="card p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-brand-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-ink">Créer un compte</h2>
        </div>
        <form onSubmit={createUser} className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="admin-email" className="label">Adresse e-mail</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@entreprise.com"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">Mot de passe temporaire</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="12 caractères minimum"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="admin-role" className="label">Niveau d’accès</label>
            <select
              id="admin-role"
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value as AdminRole)}
            >
              {ADMIN_ROLES.map((value) => (
                <option key={value} value={value}>{ADMIN_ROLE_LABELS[value]}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">{ADMIN_ROLE_DESCRIPTIONS[role]}</p>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={busy !== ""}>
              {busy === "create" ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Créer le compte
            </button>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
              <KeyRound size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Le compte est créé dans Supabase Auth. Transmettez le mot de passe temporaire au destinataire en privé.
            </p>
          </div>
        </form>
      </section>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-ink">Équipe avec accès administrateur</h2>
            <p className="mt-1 text-xs text-slate-500">{users ? `${users.length} compte(s)` : "Chargement…"}</p>
          </div>
          {busy && <LoaderCircle size={17} className="animate-spin text-slate-400" aria-label="Mise à jour" />}
        </div>

        {users === null ? (
          <p className="p-5 text-sm text-slate-500">Chargement des comptes…</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucun compte administrateur trouvé.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{user.email || "E-mail non renseigné"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    {user.lastSignInAt
                      ? ` · dernière connexion ${new Date(user.lastSignInAt).toLocaleDateString("fr-FR")}`
                      : " · jamais connecté"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input min-w-[190px] !w-auto"
                    value={user.role}
                    disabled={busy !== ""}
                    aria-label={`Rôle de ${user.email}`}
                    onChange={(event) => void updateRole(user, event.target.value as AdminRole)}
                  >
                    {ADMIN_ROLES.map((value) => (
                      <option key={value} value={value}>{ADMIN_ROLE_LABELS[value]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-outline !h-10 !px-3 text-red-700 hover:!bg-red-50"
                    disabled={busy !== ""}
                    onClick={() => void revokeAccess(user)}
                    aria-label={`Révoquer l’accès de ${user.email}`}
                    title="Révoquer l’accès administrateur"
                  >
                    <UserRoundX size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Révoquer</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {ADMIN_ROLES.map((value) => (
          <article key={value} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-ink">{ADMIN_ROLE_LABELS[value]}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{ADMIN_ROLE_DESCRIPTIONS[value]}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
