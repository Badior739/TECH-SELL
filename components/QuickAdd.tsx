"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";
import { Button } from "./ui/button";

export default function QuickAdd({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = product.stock <= 0;

  function addToCart() {
    if (unavailable) return;
    add({
      id: product.id,
      name: product.name,
      price: product.final_price,
      image: product.images?.[0],
      stock: product.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`quick-add${added ? " is-added" : ""}`}
      onClick={addToCart}
      disabled={unavailable}
      aria-label={unavailable ? `${product.name}, indisponible` : `Ajouter ${product.name} au panier`}
      title={unavailable ? "Indisponible" : added ? "Ajouté au panier" : "Ajouter au panier"}
    >
      {unavailable ? (
        <Minus size={15} aria-hidden="true" />
      ) : added ? (
        <Check size={15} aria-hidden="true" />
      ) : (
        <Plus size={16} aria-hidden="true" />
      )}
    </Button>
  );
}
