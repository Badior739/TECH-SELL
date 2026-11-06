import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleCheck, CreditCard } from "lucide-react";
import { getCategories, getProduct, getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { Badges } from "@/components/ProductCard";
import ProductCard from "@/components/ProductCard";
import AddToCart from "@/components/AddToCart";
import Gallery from "@/components/Gallery";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "Produit introuvable" };
  return {
    title: p.name,
    description: (p.description || `${p.name} — ${formatPrice(p.final_price)}`).slice(0, 155),
    openGraph: p.images?.[0] ? { images: [p.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  if (!isUuid) notFound();
  const p = await getProduct(id);
  if (!p) notFound();

  const [categories, related] = await Promise.all([
    getCategories(),
    p.category_id ? getProducts({ categoryId: p.category_id, limit: 5 }) : Promise.resolve([]),
  ]);
  const category = categories.find((c) => c.id === p.category_id);
  const others = related.filter((r) => r.id !== p.id).slice(0, 4);
  const specs = Object.entries(p.specs || {});

  return (
    <div>
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/" className="hover:underline">Accueil</Link> ›{" "}
        {category && (
          <>
            <Link href={`/categorie/${category.slug}`} className="hover:underline">{category.name}</Link> ›{" "}
          </>
        )}
        <span className="text-slate-700">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={p.images || []} alt={p.name} />

        <div>
          <Badges p={p} />
          {p.brand && (
            <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{p.brand}</div>
          )}
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">{p.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-brand-600">{formatPrice(p.final_price)}</span>
            {p.discount_percent > 0 && (
              <span className="text-base text-slate-400 line-through">{formatPrice(p.price)}</span>
            )}
          </div>

          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            <li>
              {p.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CircleCheck size={15} aria-hidden="true" />
                  En stock{p.stock <= 3 ? ` (plus que ${p.stock})` : ""}
                </span>
              ) : (
                <span className="font-semibold text-red-600">Rupture de stock</span>
              )}
            </li>
            {p.warranty_months > 0 && (
              <li className="flex items-center gap-1.5"><BadgeCheck size={15} aria-hidden="true" /> Garantie {p.warranty_months} mois</li>
            )}
            <li className="flex items-center gap-1.5"><CreditCard size={15} aria-hidden="true" /> Paiement à la livraison ou Mobile Money</li>
          </ul>

          <div className="mt-6">
            <AddToCart p={p} />
          </div>
        </div>
      </div>

      {(p.description || specs.length > 0) && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {p.description && (
            <section className="card p-5">
              <h2 className="mb-2 text-lg font-bold text-ink">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.description}</p>
            </section>
          )}
          {specs.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-2 text-lg font-bold text-ink">Caractéristiques</h2>
              <dl className="divide-y divide-slate-100 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-medium text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-extrabold text-ink">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {others.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
