"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

const empty = { id: "", name: "", slug: "", icon: "Laptop", position: 0 };

export default function CategoriesAdminPage() {
  const [list, setList] = useState<Category[] | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("position");
    setList((data as Category[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      icon: form.icon || null,
      position: Number(form.position) || 0,
    };
    const { error: err } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (err) {
      setError(err.message.includes("duplicate") ? "Cet identifiant d'URL existe déjà." : err.message);
      return;
    }
    setForm({ ...empty });
    load();
  }

  async function remove(c: Category) {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ? Les produits resteront, sans catégorie.`)) return;
    const { error: err } = await supabase.from("categories").delete().eq("id", c.id);
    if (err) setError(err.message);
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-extrabold text-ink">Catégories</h1>

      <form onSubmit={save} className="card mb-6 grid gap-3 p-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="cname">Nom</label>
          <input id="cname" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="cslug">Identifiant d&apos;URL</label>
          <input id="cslug" required className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
        </div>
        <div>
          <label className="label" htmlFor="cicon">Icône</label>
          <input id="cicon" className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="cpos">Ordre</label>
          <input id="cpos" type="number" className="input" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <button className="btn-primary">{form.id ? "Mettre à jour" : "Ajouter la catégorie"}</button>
          {form.id && (
            <button type="button" className="btn-outline" onClick={() => setForm({ ...empty })}>Annuler</button>
          )}
        </div>
      </form>

      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!list ? (
        <p className="text-slate-400">Chargement…</p>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <span className="mr-2 text-xl">{c.icon}</span>
                <span className="font-semibold">{c.name}</span>
                <span className="ml-2 text-xs text-slate-400">/{c.slug} · ordre {c.position}</span>
              </div>
              <div className="flex gap-3 text-sm font-semibold">
                <button className="text-brand-600 hover:underline" onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, icon: c.icon || "", position: c.position })}>
                  Modifier
                </button>
                <button className="text-red-600 hover:underline" onClick={() => remove(c)}>Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
