"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";
import { config, waLink } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export default function AddToCart({ p }: { p: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const out = p.stock <= 0;

  function addNow() {
    add({ id: p.id, name: p.name, price: p.final_price, image: p.images?.[0], stock: p.stock }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const wa = waLink(
    `Bonjour ${config.name}, je souhaite commander :\n• ${qty} x ${p.name} (${formatPrice(p.final_price)})\n\nPouvez-vous confirmer la disponibilité ?`
  );

  return (
    <div className="space-y-3">
      {!out && (
        <div className="flex items-center gap-3">
          <span className="label !mb-0">Quantité</span>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white">
            <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Moins">−</button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(p.stock, q + 1))} aria-label="Plus">+</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="btn-primary flex-1" disabled={out} onClick={addNow}>
          {out ? "Indisponible" : added ? <><Check size={16} aria-hidden="true" /> Ajouté</> : "Ajouter au panier"}
        </button>
        <button
          className="btn-dark flex-1"
          disabled={out}
          onClick={() => {
            addNow();
            router.push("/panier");
          }}
        >
          Acheter maintenant
        </button>
      </div>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa w-full">
        Commander via WhatsApp
      </a>
    </div>
  );
}
