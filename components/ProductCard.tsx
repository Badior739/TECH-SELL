import Link from "next/link";
import { PackageSearch } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import QuickAdd from "./QuickAdd";

export function Badges({ p }: { p: Product }) {
  const out = p.stock <= 0;
  return (
    <div className="flex flex-wrap gap-1">
      {p.discount_percent > 0 && (
        <span className="product-badge product-badge-sale">
          -{p.discount_percent}%
        </span>
      )}
      {p.tags.includes("promo") && p.discount_percent === 0 && (
        <span className="product-badge product-badge-sale">Promo</span>
      )}
      {p.tags.includes("bestseller") && (
        <span className="product-badge product-badge-featured">Best-seller</span>
      )}
      {p.tags.includes("nouveau") && (
        <span className="product-badge product-badge-new">Nouveau</span>
      )}
      {p.tags.includes("recommande") && (
        <span className="product-badge product-badge-featured">Recommandé</span>
      )}
      {out && (
        <span className="product-badge product-badge-unavailable">Rupture</span>
      )}
    </div>
  );
}

export default function ProductCard({ p }: { p: Product }) {
  const img = p.images?.[0];
  return (
    <article className="product-card group">
      <Link href={`/produit/${p.id}`} className="product-card-link">
        <div className="product-card-media">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={p.name} loading="lazy" />
          ) : (
            <div className="product-placeholder"><PackageSearch size={43} strokeWidth={1.4} aria-hidden="true" /></div>
          )}
          <div className="product-badges"><Badges p={p} /></div>
        </div>
        <div className="product-card-details">
          {p.brand && <span className="product-brand">{p.brand}</span>}
          <h3>{p.name}</h3>
          <div className="product-price-row">
            <span className="product-price">{formatPrice(p.final_price)}</span>
            {p.discount_percent > 0 && <span className="product-old-price">{formatPrice(p.price)}</span>}
          </div>
        </div>
      </Link>
      <QuickAdd product={p} />
    </article>
  );
}
