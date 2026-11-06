"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { config, waLink } from "@/lib/config";
import type { Offer, Subscriber } from "@/lib/types";

export default function ClientsAdminPage() {
  const [subs, setSubs] = useState<Subscriber[] | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const [{ data: s }, { data: o }] = await Promise.all([
      supabase.from("subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("is_active", true).gte("ends_at", now).order("ends_at"),
    ]);
    setSubs((s as Subscriber[]) || []);
    setOffers((o as Offer[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyOffer = (o: Offer) =>
    setMessage(
      `${config.name} : ${o.title} !\n-${o.percent}% sur ${
        o.category_id ? "une sélection de produits" : "tout le catalogue"
      } jusqu'au ${new Date(o.ends_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.\nCommandez vite, stock limité. Répondez à ce message pour réserver.`
    );

  const templates = [
    `Bonjour ! Nouveaux arrivages chez ${config.name} : ordinateurs, écrans et accessoires. Répondez "CATALOGUE" pour recevoir la liste.`,
    `Vente flash chez ${config.name} : -10% sur tout le catalogue ce week-end. Livraison rapide, paiement à la livraison.`,
  ];

  const active = (subs || []).filter((s) => s.opted_in);

  async function optOut(s: Subscriber) {
    await supabase.from("subscribers").update({ opted_in: false }).eq("id", s.id);
    load();
  }

  async function copyAll() {
    await navigator.clipboard.writeText(active.map((s) => s.phone).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Clients et promotions</h1>
      <p className="mb-4 text-sm text-slate-500">
        {active.length} contact(s) inscrit(s). Chaque bouton ouvre WhatsApp avec votre message prêt à envoyer.
      </p>

      <section className="card mb-6 space-y-3 p-4">
        <h2 className="text-sm font-bold text-ink">Votre message</h2>
        <textarea
          rows={5}
          className="input"
          placeholder="Écrivez votre promotion…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {offers.map((o) => (
            <button key={o.id} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600" onClick={() => applyOffer(o)}>
              Utiliser l&apos;offre « {o.title} »
            </button>
          ))}
          {templates.map((t, i) => (
            <button key={i} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-50" onClick={() => setMessage(t)}>
              Modèle {i + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          L&apos;envoi automatique à tous en un clic nécessite l&apos;API WhatsApp Business (option payante). En attendant,
          envoyez par lots ou créez une liste de diffusion WhatsApp avec les numéros copiés.
        </p>
        <button className="btn-outline" onClick={copyAll} disabled={active.length === 0}>
          {copied ? <><Check size={15} aria-hidden="true" /> Copié</> : "Copier tous les numéros"}
        </button>
      </section>

      {!subs ? (
        <p className="text-slate-400">Chargement…</p>
      ) : subs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Aucun contact pour le moment. Ils s&apos;ajoutent automatiquement à chaque commande et via le formulaire du pied de page.
        </p>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {subs.map((s) => (
            <li key={s.id} className={`flex flex-wrap items-center justify-between gap-2 p-3 ${s.opted_in ? "" : "opacity-50"}`}>
              <div>
                <div className="font-semibold">{s.name || "Client"}</div>
                <div className="text-sm text-slate-500">{s.phone}</div>
              </div>
              <div className="flex items-center gap-3">
                {s.opted_in ? (
                  <>
                    <a
                      className="btn-wa !py-1.5"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={waLink(message || `Bonjour ! Du nouveau chez ${config.name}.`, s.phone)}
                      onClick={() => setSent((a) => [...a, s.id])}
                    >
                      {sent.includes(s.id) ? <><Check size={14} aria-hidden="true" /> Envoyé</> : "Envoyer"}
                    </a>
                    <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => optOut(s)}>
                      Désinscrire
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Désinscrit</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
