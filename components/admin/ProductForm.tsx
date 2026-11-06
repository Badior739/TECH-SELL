"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TAGS, type Category } from "@/lib/types";

type Spec = { k: string; v: string };

// Réduit les photos (max 1200 px, JPEG) pour garder une boutique légère sur mobile
async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob || file;
  } catch {
    return file;
  }
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("0");
  const [warranty, setWarranty] = useState("0");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([{ k: "", v: "" }]);
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("position")
      .then(({ data }) => setCategories((data as Category[]) || []));
  }, []);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).maybeSingle(),
        supabase.from("product_costs").select("cost").eq("product_id", productId).maybeSingle(),
      ]);
      if (!p) {
        setError("Produit introuvable.");
        setLoading(false);
        return;
      }
      setName(p.name);
      setBrand(p.brand || "");
      setCategoryId(p.category_id || "");
      setPrice(String(p.price));
      setStock(String(p.stock));
      setWarranty(String(p.warranty_months));
      setDescription(p.description || "");
      setTags(p.tags || []);
      setImages(p.images || []);
      setActive(p.is_active);
      const entries = Object.entries((p.specs || {}) as Record<string, string>).map(([k, v]) => ({ k, v }));
      setSpecs(entries.length ? entries : [{ k: "", v: "" }]);
      setCost(c ? String(c.cost) : "");
      setLoading(false);
    })();
  }, [productId]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const blob = await compress(file);
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40) || "img";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}.jpg`;
      const { error: err } = await supabase.storage
        .from("products")
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (err) {
        setError(`Envoi de l'image impossible : ${err.message}`);
        continue;
      }
      urls.push(supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.k.trim() && s.v.trim()) specsObj[s.k.trim()] = s.v.trim();
    });

    const payload = {
      name: name.trim(),
      brand: brand.trim() || null,
      category_id: categoryId || null,
      price: Math.max(0, parseInt(price || "0", 10)),
      stock: Math.max(0, parseInt(stock || "0", 10)),
      warranty_months: Math.max(0, parseInt(warranty || "0", 10)),
      description: description.trim() || null,
      specs: specsObj,
      tags,
      images,
      is_active: active,
    };

    let id = productId;
    if (id) {
      const { error: err } = await supabase.from("products").update(payload).eq("id", id);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase.from("products").insert(payload).select("id").single();
      if (err || !data) {
        setError(err?.message || "Création impossible.");
        setSaving(false);
        return;
      }
      id = data.id as string;
    }

    if (cost !== "") {
      await supabase.from("product_costs").upsert({ product_id: id, cost: Math.max(0, parseInt(cost, 10) || 0) });
    }

    router.push("/admin/produits");
  }

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  if (loading) return <p className="text-slate-400">Chargement…</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{productId ? "Modifier le produit" : "Nouveau produit"}</h1>
        <Link href="/admin/produits" className="text-sm text-slate-500 hover:underline">← Retour</Link>
      </div>

      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Nom du produit</label>
            <input id="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="HP Pavilion 15 — Core i5, 8 Go, 512 Go SSD" />
          </div>
          <div>
            <label className="label" htmlFor="brand">Marque</label>
            <input id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="HP, Dell, Lenovo…" />
          </div>
          <div>
            <label className="label" htmlFor="cat">Catégorie</label>
            <select id="cat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="price">Prix de vente (FCFA)</label>
            <input id="price" required type="number" min={0} className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cost">Prix d&apos;achat (privé)</label>
            <input id="cost" type="number" min={0} className="input" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Pour calculer la marge" />
          </div>
          <div>
            <label className="label" htmlFor="stock">Stock</label>
            <input id="stock" required type="number" min={0} className="input" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="warranty">Garantie (mois)</label>
            <input id="warranty" type="number" min={0} className="input" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea id="desc" rows={4} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-bold text-ink">Caractéristiques techniques</h2>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className="input" placeholder="RAM" value={s.k} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} />
            <input className="input" placeholder="8 Go DDR4" value={s.v} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
            <button type="button" className="px-2 text-red-600" aria-label="Retirer" onClick={() => setSpecs((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : [{ k: "", v: "" }]))}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => setSpecs((a) => [...a, { k: "", v: "" }])}>+ Ligne</button>
          {["Processeur", "RAM", "Stockage", "Écran", "Carte graphique", "Système"].map((k) => (
            <button
              key={k}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-brand-50"
              onClick={() =>
                setSpecs((a) => {
                  if (a.some((x) => x.k === k)) return a;
                  const empty = a.findIndex((x) => !x.k && !x.v);
                  if (empty >= 0) return a.map((x, j) => (j === empty ? { k, v: "" } : x));
                  return [...a, { k, v: "" }];
                })
              }
            >
              + {k}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-bold text-ink">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain" />
              {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-ink/70 text-center text-[10px] text-white">Principale</span>}
              <button
                type="button"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs text-white"
                onClick={() => setImages((a) => a.filter((x) => x !== src))}
                aria-label="Retirer l'image"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 hover:border-brand-500">
            {uploading ? "Envoi…" : "+ Ajouter"}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-bold text-ink">Étiquettes et visibilité</h2>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium ${
                tags.includes(t.value) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300"
              }`}
            >
              <input type="checkbox" hidden checked={tags.includes(t.value)} onChange={() => toggleTag(t.value)} />
              {t.label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Produit visible dans la boutique
        </label>
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button className="btn-primary" disabled={saving || uploading}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin/produits" className="btn-outline">Annuler</Link>
      </div>
    </form>
  );
}
