"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, TriangleAlert, Upload } from "lucide-react";
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

const SNAPSHOT_FORMAT = "tech-sell-dashboard";
const SNAPSHOT_VERSION = 1;
const SNAPSHOT_STORAGE_KEY = "tech-sell-dashboard-snapshot-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStats(value: unknown): value is Stats {
  if (!isRecord(value)) return false;
  const numericFields = ["sales_month", "sales_week", "orders_month", "pending_orders", "margin_month"];
  return (
    numericFields.every((field) => typeof value[field] === "number" && Number.isFinite(value[field])) &&
    Array.isArray(value.top_products) &&
    value.top_products.every(
      (item) =>
        isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.qty === "number" &&
        Number.isFinite(item.qty),
    ) &&
    Array.isArray(value.low_stock) &&
    value.low_stock.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.stock === "number" &&
        Number.isFinite(item.stock),
    ) &&
    Array.isArray(value.daily) &&
    value.daily.every(
      (item) =>
        isRecord(item) &&
        typeof item.day === "string" &&
        typeof item.total === "number" &&
        Number.isFinite(item.total),
    )
  );
}

function parseSnapshot(value: unknown): Stats | null {
  if (
    !isRecord(value) ||
    value.format !== SNAPSHOT_FORMAT ||
    value.version !== SNAPSHOT_VERSION ||
    !isStats(value.stats)
  ) {
    return null;
  }
  return value.stats;
}

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
  const [syncStatus, setSyncStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importRevision = useRef(0);

  const syncFromSupabase = useCallback(async () => {
    const revision = importRevision.current;
    setSyncing(true);
    setError("");
    let data: unknown;
    let err: { message: string } | null;
    try {
      const result = await supabase.rpc("dashboard_stats");
      data = result.data;
      err = result.error;
    } catch {
      setError("Impossible de joindre Supabase pour synchroniser le tableau de bord.");
      setSyncing(false);
      return;
    }
    if (revision !== importRevision.current) {
      setSyncing(false);
      return;
    }
    if (err) {
      setError(err.message);
      setSyncing(false);
      return;
    }
    if (!isStats(data)) {
      setError("Les données reçues de Supabase ne correspondent pas au format du tableau de bord.");
      setSyncing(false);
      return;
    }
    setS(data);
    setSyncStatus("Données synchronisées depuis Supabase.");
    try {
      localStorage.setItem(
        SNAPSHOT_STORAGE_KEY,
        JSON.stringify({
          format: SNAPSHOT_FORMAT,
          version: SNAPSHOT_VERSION,
          exportedAt: new Date().toISOString(),
          stats: data,
        }),
      );
    } catch {
      setSyncStatus("Données chargées, mais la copie locale n’a pas pu être enregistrée.");
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (saved) {
        const stats = parseSnapshot(JSON.parse(saved) as unknown);
        if (stats) {
          setS(stats);
          setSyncStatus("Copie locale affichée ; synchronisez pour récupérer les dernières données.");
        }
      }
    } catch {
      setError("Impossible de lire la copie locale du tableau de bord.");
    }
    void syncFromSupabase();
  }, [syncFromSupabase]);

  function exportSnapshot() {
    if (!s) return;
    const snapshot = {
      format: SNAPSHOT_FORMAT,
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      stats: s,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tech-sell-tableau-de-bord-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSyncStatus("Instantané JSON exporté.");
  }

  async function importSnapshot(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    try {
      const stats = parseSnapshot(JSON.parse(await file.text()) as unknown);
      if (!stats) {
        setError("Fichier invalide ou incompatible. Choisissez un export JSON du tableau de bord.");
        return;
      }
      importRevision.current += 1;
      setS(stats);
      localStorage.setItem(
        SNAPSHOT_STORAGE_KEY,
        JSON.stringify({
          format: SNAPSHOT_FORMAT,
          version: SNAPSHOT_VERSION,
          exportedAt: new Date().toISOString(),
          stats,
        }),
      );
      setSyncStatus("Instantané importé sur cet appareil. Il ne modifie pas les données Supabase.");
    } catch {
      setError("Impossible de lire ce fichier JSON ou d’enregistrer sa copie locale.");
    } finally {
      input.value = "";
    }
  }

  const max = Math.max(1, ...(s?.daily ?? []).map((d) => d.total));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => void syncFromSupabase()} disabled={syncing}>
            <RefreshCw size={15} aria-hidden="true" />
            {syncing ? "Synchronisation…" : "Synchroniser"}
          </button>
          <button className="btn-outline" onClick={() => fileInput.current?.click()}>
            <Upload size={15} aria-hidden="true" /> Importer JSON
          </button>
          <button className="btn-primary" onClick={exportSnapshot} disabled={!s}>
            <Download size={15} aria-hidden="true" /> Exporter JSON
          </button>
          <input
            ref={fileInput}
            className="hidden"
            type="file"
            accept="application/json,.json"
            onChange={importSnapshot}
          />
        </div>
      </header>

      <p className="text-xs text-slate-500">
        L’import et l’export concernent uniquement les indicateurs du tableau de bord et la copie locale de cet appareil ;
        ils ne modifient pas les données de la boutique.
      </p>
      {syncStatus && <p className="text-xs text-emerald-700" role="status">{syncStatus}</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      {!s ? (
        <p className="text-slate-400">Chargement du tableau de bord… Importez un instantané JSON si nécessaire.</p>
      ) : (
        <>

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
        </>
      )}
    </div>
  );
}
