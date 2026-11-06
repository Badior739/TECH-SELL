"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";

type Stats = {
  sales_month: number;
  sales_week: number;
  orders_month: number;
  pending_orders: number;
  margin_month: number;
  top_products: { name: string; qty: number }[];
  low_stock: { id: string; name: string; stock: number }[];
  daily: { day: string; total: number }[];
};

function Kpi({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.rpc("dashboard_stats").then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setS(data as Stats);
    });
  }, []);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!s) return <p className="text-slate-400">Chargement…</p>;

  const max = Math.max(1, ...s.daily.map((d) => d.total));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-ink">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ventes du mois" value={formatPrice(s.sales_month)} hint="Commandes validées et livrées" />
        <Kpi label="Ventes de la semaine" value={formatPrice(s.sales_week)} />
        <Kpi
          label="Commandes en cours"
          value={String(s.pending_orders)}
          hint="À valider"
          href="/admin/commandes"
        />
        <Kpi label="Marge estimée (mois)" value={formatPrice(s.margin_month)} hint={`${s.orders_month} commande(s) ce mois`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-ink">Ventes des 7 derniers jours</h2>
          <div className="flex h-44 items-end gap-2">
            {s.daily.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="text-[10px] text-slate-400">{d.total > 0 ? Math.round(d.total / 1000) + "k" : ""}</div>
                <div
                  className="w-full rounded-t-lg bg-brand-500"
                  style={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 4 : 1)}%`, minHeight: 2 }}
                  title={formatPrice(d.total)}
                />
                <div className="text-[10px] text-slate-500">{d.day}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-ink">Top produits du mois</h2>
          {s.top_products.length === 0 ? (
            <p className="text-sm text-slate-400">Pas encore de ventes.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {s.top_products.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-3">
                  <span className="truncate">{i + 1}. {p.name}</span>
                  <span className="font-bold">{p.qty}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <TriangleAlert size={16} className="text-amber-600" aria-hidden="true" />
          Stock bas
        </h2>
        {s.low_stock.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune alerte.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {s.low_stock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/produits/${p.id}`} className="hover:underline">{p.name}</Link>
                <span className={`font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                  {p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
