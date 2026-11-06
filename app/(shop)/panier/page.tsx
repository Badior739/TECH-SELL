"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PackageSearch, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { config, waLink } from "@/lib/config";

type Done = { number: number; total: number; message: string };

export default function CartPage() {
  const { items, total, ready, setQty, remove, clear } = useCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "Ouagadougou",
    address: "",
    note: "",
    payment: "livraison",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 8) {
      setError("Entrez un numéro de téléphone valide.");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.rpc("create_order", {
      p_name: form.name,
      p_phone: form.phone,
      p_address: form.address,
      p_city: form.city,
      p_note: form.note,
      p_payment: form.payment,
      p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    });
    setLoading(false);

    if (err || !data) {
      setError(err?.message || "Impossible d'enregistrer la commande. Réessayez.");
      return;
    }

    const res = data as { order_number: number; total: number };
    const lines = items.map((i) => `• ${i.quantity} x ${i.name}`).join("\n");
    const message =
      `Bonjour ${config.name}, voici ma commande n°${res.order_number} :\n${lines}\n\n` +
      `Total : ${formatPrice(res.total)}\nNom : ${form.name}\nTéléphone : ${form.phone}\n` +
      `Livraison : ${form.address || "-"}, ${form.city}\n` +
      `Paiement : ${form.payment === "mobile_money" ? "Mobile Money" : "à la livraison"}`;

    setDone({ number: res.order_number, total: res.total, message });
    clear();
  }

  if (!ready) return <p className="py-20 text-center text-slate-400">Chargement…</p>;

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <Check size={27} strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Commande n°{done.number} enregistrée</h1>
        <p className="mt-2 text-slate-600">
          Total : <strong>{formatPrice(done.total)}</strong>. Nous vous appelons très vite pour confirmer la
          livraison. Pour aller plus vite, envoyez le récapitulatif sur WhatsApp.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={waLink(done.message)} target="_blank" rel="noopener noreferrer" className="btn-wa">
            Envoyer sur WhatsApp
          </a>
          <Link href="/" className="btn-outline">Continuer mes achats</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="mx-auto text-slate-400" size={40} strokeWidth={1.4} aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-ink">Votre panier est vide</h1>
        <Link href="/categorie/tous" className="btn-primary mt-5">Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink">Mon panier</h1>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-3">
          {items.map((i) => (
            <div key={i.id} className="card flex items-center gap-3 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {i.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300">
                    <PackageSearch size={27} strokeWidth={1.4} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/produit/${i.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:underline">
                  {i.name}
                </Link>
                <div className="text-sm font-bold text-brand-600">{formatPrice(i.price)}</div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button className="px-2.5 py-1" onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Moins">−</button>
                    <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                    <button className="px-2.5 py-1" onClick={() => setQty(i.id, i.quantity + 1)} aria-label="Plus">+</button>
                  </div>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => remove(i.id)}>
                    Retirer
                  </button>
                </div>
              </div>
              <div className="hidden text-right text-sm font-bold sm:block">{formatPrice(i.price * i.quantity)}</div>
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="card h-fit space-y-3 p-5 lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Finaliser la commande</h2>
          <div>
            <label className="label" htmlFor="name">Nom complet</label>
            <input id="name" required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Téléphone (WhatsApp)</label>
            <input id="phone" required inputMode="tel" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="city">Ville</label>
              <input id="city" required className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="address">Quartier / adresse</label>
              <input id="address" required className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="note">Note (facultatif)</label>
            <textarea id="note" rows={2} className="input" value={form.note} onChange={(e) => set("note", e.target.value)} />
          </div>

          <fieldset>
            <legend className="label">Paiement</legend>
            <div className="space-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 p-3">
                <input type="radio" name="payment" checked={form.payment === "livraison"} onChange={() => set("payment", "livraison")} />
                Payer à la livraison
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 p-3">
                <input type="radio" name="payment" checked={form.payment === "mobile_money"} onChange={() => set("payment", "mobile_money")} />
                Mobile Money (Orange / Moov / Coris)
              </label>
            </div>
          </fieldset>

          <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between text-base font-extrabold text-ink">
              <span>Total produits</span>
              <span>{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-slate-500">{config.shippingInfo}. Les frais exacts sont confirmés à la validation.</p>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Envoi…" : "Confirmer la commande"}
          </button>
        </form>
      </div>
    </div>
  );
}
