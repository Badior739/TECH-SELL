"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  tags: string[];
  is_active: boolean;
  images: string[];
  categories: { name: string } | null;
};

export default function ProductsAdminPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("products")
      .select("id,name,brand,price,stock,tags,is_active,images,categories(name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setRows(data as unknown as Row[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(r: Row) {
    await supabase.from("products").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  }

  async function remove(r: Row) {
    if (!confirm(`Supprimer « ${r.name} » ? Cette action est définitive.`)) return;
    const { error: err } = await supabase.from("products").delete().eq("id", r.id);
    if (err) alert(err.message);
    load();
  }

  const filtered = (rows || []).filter((r) =>
    `${r.name} ${r.brand || ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn-primary">+ Ajouter un produit</Link>
      </div>

      <input className="input mb-4 max-w-sm" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />

      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!rows ? (
        <p className="text-slate-400">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Aucun produit. Commencez par en ajouter un.
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Produit</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Visible</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {r.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.images[0]} alt="" className="h-full w-full object-contain" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-ink">{r.name}</div>
                        <div className="text-xs text-slate-400">{r.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{r.categories?.name || "-"}</td>
                  <td className="p-3 font-semibold">{formatPrice(r.price)}</td>
                  <td className={`p-3 font-bold ${r.stock === 0 ? "text-red-600" : r.stock <= 3 ? "text-amber-600" : ""}`}>
                    {r.stock}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggle(r)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {r.is_active ? "Oui" : "Non"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/produits/${r.id}`} className="mr-3 font-semibold text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button onClick={() => remove(r)} className="font-semibold text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
