import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  Headphones,
  Laptop,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { getActiveOffers, getCategories, getProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import CategoryIcon from "@/components/CategoryIcon";
import OfferBanner from "@/components/OfferBanner";
import { config, waLink } from "@/lib/config";
import type { Product } from "@/lib/types";

export const revalidate = 60;

function Section({
  eyebrow,
  title,
  href,
  products,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  products: Product[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="shop-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-link">
            Tout découvrir <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="product-grid">
        {products.map((p, index) => (
          <div className="reveal-up" style={{ animationDelay: `${index * 70}ms` }} key={p.id}>
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [categories, offers, promos, news, best] = await Promise.all([
    getCategories(),
    getActiveOffers(),
    getProducts({ promoOnly: true, limit: 8 }),
    getProducts({ sort: "recent", limit: 8 }),
    getProducts({ tag: "bestseller", limit: 8 }),
  ]);
  const offer = offers[0];

  return (
    <div className="home-page">
      {offer && <OfferBanner offer={offer} />}
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" />
            L’essentiel, sans compromis
          </div>
          <h1>
            La technologie
            <br />
            <span>bien choisie.</span>
            <br />
            Au bon endroit.
          </h1>
          <p>
            Ordinateurs, équipements et accessoires fiables. Des conseils utiles,
            des prix clairs et une livraison partout au Burkina Faso.
          </p>
          <div className="hero-actions">
            <Link href="/categorie/tous" className="hero-cta">
              Voir le catalogue <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <a
              href={waLink(`Bonjour ${config.name}, je cherche un conseil pour choisir mon matériel.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-secondary"
            >
              Besoin d’un conseil ?
            </a>
          </div>
          {offer && (
            <Link href="/categorie/tous?promo=1" className="hero-offer">
              <span className="offer-spark"><Sparkles size={18} strokeWidth={1.7} /></span>
              <span>
                <strong>{offer.title}</strong>
                <small>Jusqu’à -{offer.percent}% · voir les offres</small>
              </span>
              <ArrowUpRight className="offer-arrow" size={15} aria-hidden="true" />
            </Link>
          )}
          <div className="hero-footnote">
            <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
            Produits vérifiés · Garantie selon le produit
          </div>
        </div>

        <div className="hero-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=85"
            alt="Ordinateur portable dans un espace de travail lumineux"
            fetchPriority="high"
          />
          <div className="hero-image-shade" />
          <div className="visual-note visual-note-top">
            <Laptop className="visual-note-icon" size={19} strokeWidth={1.7} />
            <span>La bonne technologie.<br />Au quotidien.</span>
          </div>
          <div className="visual-caption">
            <span className="caption-line" />
            <span>WORK / CREATE / REPEAT</span>
            <span className="caption-index">01 — 26</span>
          </div>
          <div className="visual-sticker"><BadgeCheck size={20} strokeWidth={1.6} /><span>Vérifié</span></div>
        </div>
      </section>

      <section className="benefit-row" aria-label="Nos services">
        <div className="benefit-item">
          <Truck className="benefit-icon" strokeWidth={1.7} aria-hidden="true" />
          <div><strong>Livraison suivie</strong><small>À Ouagadougou et partout au pays</small></div>
        </div>
        <div className="benefit-item">
          <ShieldCheck className="benefit-icon" strokeWidth={1.7} aria-hidden="true" />
          <div><strong>Matériel vérifié</strong><small>Garantie selon le produit</small></div>
        </div>
        <div className="benefit-item">
          <CreditCard className="benefit-icon" strokeWidth={1.7} aria-hidden="true" />
          <div><strong>Paiement flexible</strong><small>Mobile Money ou à la livraison</small></div>
        </div>
        <div className="benefit-item">
          <Headphones className="benefit-icon" strokeWidth={1.7} aria-hidden="true" />
          <div><strong>Conseil personnalisé</strong><small>Une équipe à votre écoute</small></div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="shop-section category-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">À chacun son essentiel</span>
              <h2>Explorez nos univers<span className="heading-period">.</span></h2>
            </div>
            <Link href="/categorie/tous" className="text-link">
              Tout le catalogue <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categorie/${category.slug}`}
                className={`category-tile category-tone-${index % 4}`}
              >
                <CategoryIcon
                  name={category.name}
                  slug={category.slug}
                  icon={category.icon}
                  className="category-icon"
                />
                <span className="category-name">{category.name}</span>
                <ArrowUpRight className="category-arrow" size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <Section eyebrow="À prix doux" title="Les bonnes affaires" href="/categorie/tous?promo=1" products={promos} />
      <Section eyebrow="Choisis pour vous" title="Les incontournables" href="/categorie/tous" products={best} />
      <Section eyebrow="Tout juste arrivés" title="Les nouveautés" href="/categorie/tous" products={news} />

      {promos.length + best.length + news.length === 0 && (
        <div className="empty-catalog">
          <PackageCheck size={20} strokeWidth={1.7} aria-hidden="true" />
          <p>Notre sélection se prépare. Revenez bientôt découvrir les nouveautés.</p>
        </div>
      )}

      <section className="pro-banner">
        <div className="pro-mark"><Laptop size={25} strokeWidth={1.5} /><span>PRO</span></div>
        <div className="pro-copy">
          <span className="eyebrow">Pour les projets qui comptent</span>
          <h2>Votre équipe mérite<br />le bon équipement.</h2>
          <p>Entreprises, écoles et ONG : parlons de vos besoins et préparons un devis adapté.</p>
        </div>
        <a
          href={waLink(`Bonjour ${config.name}, je souhaite un devis pour un achat en gros de matériel informatique.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="pro-cta"
        >
          Demander un devis <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
