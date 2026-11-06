import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveOffers, getCategories, getProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import OfferBanner from "@/components/OfferBanner";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; brand?: string; tri?: string; promo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  if (resolvedParams.slug === "tous") return { title: "Catalogue" };
  const cats = await getCategories();
  const c = cats.find((x) => x.slug === resolvedParams.slug);
  return { title: c ? c.name : "Catalogue" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const categories = await getCategories();
  const isAll = resolvedParams.slug === "tous";
  const category = categories.find((c) => c.slug === resolvedParams.slug);
  if (!isAll && !category) notFound();

  const q = (resolvedSearchParams.q || "").trim();
  const promoOnly = resolvedSearchParams.promo === "1";

  const [all, offers] = await Promise.all([
    getProducts({
      categoryId: category?.id,
      q: q || undefined,
      sort: resolvedSearchParams.tri,
      promoOnly,
    }),
    promoOnly ? getActiveOffers() : Promise.resolve([]),
  ]);
  const offer = offers.find((activeOffer) => !activeOffer.category_id || activeOffer.category_id === category?.id);

  const brands = Array.from(new Set(all.map((p) => p.brand).filter(Boolean))) as string[];
  const brand = resolvedSearchParams.brand || "";
  const products = brand ? all.filter((p) => p.brand === brand) : all;

  const title = promoOnly
    ? "Promotions"
    : q
    ? `Résultats pour « ${q} »`
    : category
    ? `${category.icon ?? ""} ${category.name}`
    : "Tout le catalogue";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {products.length} produit{products.length > 1 ? "s" : ""}
      </p>

      {promoOnly && offer && <div className="mt-5"><OfferBanner offer={offer} /></div>}

      <form method="get" className="card mt-4 flex flex-wrap items-end gap-3 p-3">
        {q && <input type="hidden" name="q" value={q} />}
        {promoOnly && <input type="hidden" name="promo" value="1" />}
        <div className="min-w-[140px] flex-1">
          <label className="label" htmlFor="brand">Marque</label>
          <select id="brand" name="brand" defaultValue={brand} className="input">
            <option value="">Toutes</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="label" htmlFor="tri">Trier par</label>
          <select id="tri" name="tri" defaultValue={resolvedSearchParams.tri || ""} className="input">
            <option value="">Nouveautés</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
          </select>
        </div>
        <button className="btn-dark">Appliquer</button>
      </form>

      {products.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Aucun produit trouvé.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
