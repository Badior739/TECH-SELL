"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, KeyRound, LoaderCircle, Shield, Trash2, UserPlus } from "lucide-react";
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

type AdminUsersResponse = {
  users?: AdminUser[];
  currentUserId?: string;
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
  return response.json() as Promise<AdminUsersResponse>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
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
      setCurrentUserId(result?.currentUserId || "");
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

  function exportUsers() {
    if (!users?.length) return;
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["E-mail", "Rôle", "Date de création", "Dernière connexion"],
      ...users.map((user) => [
        user.email,
        ADMIN_ROLE_LABELS[user.role],
        new Date(user.createdAt).toLocaleDateString("fr-FR"),
        user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString("fr-FR") : "Jamais connecté",
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `utilisateurs-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
    if (!window.confirm(`Supprimer définitivement le compte de ${user.email} et révoquer son accès ? Cette action est irréversible.`)) return;
    setError("");
    setSuccess("");
    setBusy(user.id);
    try {
      await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setSuccess(`Le compte de ${user.email} et son accès administrateur ont été supprimés.`);
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-ink">Équipe avec accès administrateur</h2>
            <p className="mt-1 text-xs text-slate-500">{users ? `${users.length} compte(s)` : "Chargement…"}</p>
          </div>
          <div className="flex items-center gap-2">
            {busy && <LoaderCircle size={17} className="animate-spin text-slate-400" aria-label="Mise à jour" />}
            <button type="button" className="btn-outline !h-9 !px-3" disabled={!users?.length || busy !== ""} onClick={exportUsers}>
              <Download size={15} aria-hidden="true" />
              Exporter CSV
            </button>
          </div>
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
                    disabled={busy !== "" || user.id === currentUserId}
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
                    disabled={busy !== "" || user.id === currentUserId}
                    onClick={() => void revokeAccess(user)}
                    aria-label={`Supprimer le compte de ${user.email}`}
                    title={user.id === currentUserId ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer le compte"}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Supprimer</span>
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
