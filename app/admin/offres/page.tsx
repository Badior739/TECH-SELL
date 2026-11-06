"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, toLocalInput } from "@/lib/format";
import Countdown from "@/components/Countdown";
import type { Category, Offer } from "@/lib/types";

// Prochain dimanche à 23:59 (fin de semaine)
function endOfWeek(): Date {
  const d = new Date();
  const add = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  d.setHours(23, 59, 0, 0);
  return d;
}

export default function OffersAdminPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("Offre de la semaine");
  const [percent, setPercent] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [starts, setStarts] = useState(toLocalInput(new Date()));
  const [ends, setEnds] = useState(toLocalInput(endOfWeek()));

  const load = useCallback(async () => {
    const [{ data: o }, { data: c }] = await Promise.all([
      supabase.from("offers").select("*").order("ends_at", { ascending: false }),
      supabase.from("categories").select("*").order("position"),
    ]);
    setOffers((o as Offer[]) || []);
    setCats((c as Category[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const s = new Date(starts);
    const en = new Date(ends);
    if (en <= s) {
      setError("La date de fin doit être après la date de début.");
      return;
    }
    const { error: err } = await supabase.from("offers").insert({
      title: title.trim(),
      percent: Math.min(90, Math.max(1, parseInt(percent, 10) || 1)),
      category_id: categoryId || null,
      starts_at: s.toISOString(),
      ends_at: en.toISOString(),
      is_active: true,
    });
    if (err) setError(err.message);
    else load();
  }

  async function toggle(o: Offer) {
    await supabase.from("offers").update({ is_active: !o.is_active }).eq("id", o.id);
    load();
  }

  async function remove(o: Offer) {
    if (!confirm(`Supprimer l'offre « ${o.title} » ?`)) return;
    await supabase.from("offers").delete().eq("id", o.id);
    load();
  }

  const now = Date.now();
  const status = (o: Offer) => {
    if (!o.is_active) return { label: "Désactivée", cls: "bg-slate-200 text-slate-600" };
    if (new Date(o.ends_at).getTime() < now) return { label: "Terminée", cls: "bg-slate-200 text-slate-600" };
    if (new Date(o.starts_at).getTime() > now) return { label: "Programmée", cls: "bg-blue-100 text-blue-700" };
    return { label: "En cours", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Offres et compte à rebours</h1>
      <p className="mb-4 text-sm text-slate-500">
        Une offre active applique automatiquement la remise sur les produits concernés et affiche un compte à
        rebours sur l&apos;accueil.
      </p>

      <form onSubmit={create} className="card mb-6 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="otitle">Titre</label>
          <input id="otitle" required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="opercent">Réduction (%)</label>
          <input id="opercent" required type="number" min={1} max={90} className="input" value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="ocat">S&apos;applique à</label>
          <select id="ocat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Tout le catalogue</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div />
        <div>
          <label className="label" htmlFor="ostart">Début</label>
          <input id="ostart" type="datetime-local" required className="input" value={starts} onChange={(e) => setStarts(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="oend">Fin</label>
          <input id="oend" type="datetime-local" required className="input" value={ends} onChange={(e) => setEnds(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-50" onClick={() => { const n = new Date(); setStarts(toLocalInput(n)); setEnds(toLocalInput(new Date(n.getTime() + 24 * 3600 * 1000))); }}>
            Dans 24 h
          </button>
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-50" onClick={() => { setStarts(toLocalInput(new Date())); setEnds(toLocalInput(endOfWeek())); }}>
            Jusqu&apos;à dimanche
          </button>
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-50" onClick={() => { const n = new Date(); setStarts(toLocalInput(n)); setEnds(toLocalInput(new Date(n.getTime() + 7 * 24 * 3600 * 1000))); }}>
            7 jours
          </button>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button className="btn-primary">Lancer l&apos;offre</button>
        </div>
      </form>

      {!offers ? (
        <p className="text-slate-400">Chargement…</p>
      ) : offers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Aucune offre pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {offers.map((o) => {
            const st = status(o);
            const cat = cats.find((c) => c.id === o.category_id);
            return (
              <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{o.title} · -{o.percent}%</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {cat ? cat.name : "Tout le catalogue"} · {formatDate(o.starts_at)} → {formatDate(o.ends_at)}
                  </div>
                  {st.label === "En cours" && (
                    <div className="mt-1 text-sm font-semibold text-red-600">
                      Fin dans <Countdown endsAt={o.ends_at} compact />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 text-sm font-semibold">
                  <button className="text-brand-600 hover:underline" onClick={() => toggle(o)}>
                    {o.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(o)}>Supprimer</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
