"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, formatPrice } from "@/lib/format";
import { config, waLink } from "@/lib/config";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  nouvelle: { label: "Nouvelle", cls: "bg-amber-100 text-amber-700" },
  validee: { label: "Validée", cls: "bg-blue-100 text-blue-700" },
  livree: { label: "Livrée", cls: "bg-emerald-100 text-emerald-700" },
  annulee: { label: "Annulée", cls: "bg-slate-200 text-slate-600" },
};

const FILTERS: (OrderStatus | "toutes")[] = ["nouvelle", "validee", "livree", "annulee", "toutes"];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "toutes">("nouvelle");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(id,name,unit_price,quantity)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    else setOrders(data as Order[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(o: Order, status: OrderStatus) {
    if (status === "annulee" && !confirm(`Annuler la commande n°${o.order_number} ?`)) return;
    setBusy(o.id);
    setError("");
    const { error: err } = await supabase.rpc("set_order_status", { p_id: o.id, p_status: status });
    if (err) setError(err.message);
    setBusy(null);
    load();
  }

  const list = (orders || []).filter((o) => filter === "toutes" || o.status === filter);
  const count = (s: OrderStatus) => (orders || []).filter((o) => o.status === s).length;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-ink">Commandes</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === f ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {f === "toutes" ? "Toutes" : STATUS[f].label}
            {f !== "toutes" && ` (${count(f)})`}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!orders ? (
        <p className="text-slate-400">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Aucune commande dans cette catégorie.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const msg = `Bonjour ${o.customer_name}, ici ${config.name}. Votre commande n°${o.order_number} (${formatPrice(o.total)}) est ${
              o.status === "validee" ? "validée" : o.status === "livree" ? "livrée, merci pour votre confiance !" : "bien reçue"
            }.`;
            return (
              <article key={o.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-ink">Commande n°{o.order_number}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS[o.status].cls}`}>
                        {STATUS[o.status].label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(o.created_at)}</div>
                  </div>
                  <div className="text-right text-lg font-extrabold text-brand-600">{formatPrice(o.total)}</div>
                </div>

                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="font-semibold">{o.customer_name}</div>
                    <div className="text-slate-600">{o.phone}</div>
                    <div className="text-slate-600">{[o.address, o.city].filter(Boolean).join(", ")}</div>
                    <div className="text-xs text-slate-400">
                      Paiement : {o.payment_method === "mobile_money" ? "Mobile Money" : "à la livraison"}
                    </div>
                    {o.note && <div className="mt-1 text-xs italic text-slate-500">« {o.note} »</div>}
                  </div>
                  <ul className="space-y-1">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span>{it.quantity} × {it.name}</span>
                        <span className="text-slate-500">{formatPrice(it.unit_price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.status === "nouvelle" && (
                    <button className="btn-primary" disabled={busy === o.id} onClick={() => setStatus(o, "validee")}>
                      <Check size={15} aria-hidden="true" /> Valider
                    </button>
                  )}
                  {o.status === "validee" && (
                    <button className="btn-primary" disabled={busy === o.id} onClick={() => setStatus(o, "livree")}>
                      Marquer livrée
                    </button>
                  )}
                  {o.status !== "annulee" && o.status !== "livree" && (
                    <button className="btn-outline" disabled={busy === o.id} onClick={() => setStatus(o, "annulee")}>
                      Annuler
                    </button>
                  )}
                  <a className="btn-outline" href={`tel:${o.phone.replace(/\s/g, "")}`}>Appeler</a>
                  <a className="btn-wa" target="_blank" rel="noopener noreferrer" href={waLink(msg, o.phone)}>
                    WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
