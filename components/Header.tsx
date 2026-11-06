"use client";

import Link from "next/link";
import { ArrowUpRight, MessageCircle, Search, ShoppingBag, Truck } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "./CartProvider";
import { config, waLink } from "@/lib/config";
import type { Category } from "@/lib/types";
import CategoryIcon from "./CategoryIcon";

export default function Header({ categories }: { categories: Category[] }) {
  const { count } = useCart();

  return (
    <header className="shop-header">
      <div className="announcement-bar">
        <Truck size={13} strokeWidth={1.8} aria-hidden="true" />
        <span>{config.shippingInfo}</span>
        <a
          href={waLink(`Bonjour ${config.name}, j'ai une question.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-contact"
        >
          Une question ? Écrivez-nous <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>

      <div className="header-main">
        <div className="header-main-inner">
          <Link href="/" className="brand-lockup" aria-label={`${config.name}, accueil`}>
            <span className="brand-symbol"><span /></span>
            <span className="brand-name">{config.name}<small>INFORMATIQUE & ACCESSOIRES</small></span>
          </Link>

          <form action="/categorie/tous" className="header-search">
            <Search className="search-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
            <input name="q" placeholder="Que recherchez-vous ?" aria-label="Rechercher un produit" />
            <button type="submit">Rechercher</button>
          </form>

          <div className="header-actions">
            <ThemeToggle />
            <a
              href={waLink(`Bonjour ${config.name}, j'ai une question.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="header-contact"
            >
              <MessageCircle size={17} strokeWidth={1.7} aria-hidden="true" />
              <span>Besoin d’aide ?<small>Conseil sur WhatsApp</small></span>
            </a>
            <Link href="/panier" className="cart-button">
              <ShoppingBag className="cart-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
              <span className="cart-label">Panier</span>
              <span className="cart-count" aria-label={`${count} article${count > 1 ? "s" : ""}`}>
                {count}
              </span>
            </Link>
          </div>
        </div>

        <form action="/categorie/tous" className="mobile-search">
          <input name="q" placeholder="Rechercher un produit…" aria-label="Rechercher un produit" />
          <button type="submit" aria-label="Rechercher">
            <Search size={17} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </form>
      </div>

      <nav className="category-nav" aria-label="Catégories">
        <div className="category-nav-inner">
          <Link href="/categorie/tous" className="nav-all">Tout le catalogue <ArrowUpRight size={13} aria-hidden="true" /></Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/categorie/${category.slug}`}>
              <CategoryIcon
                name={category.name}
                slug={category.slug}
                icon={category.icon}
                className="nav-category-icon"
              />
              {category.name}
            </Link>
          ))}
          <Link href="/categorie/tous?promo=1" className="nav-promo"><span className="promo-mark">%</span> Promotions</Link>
        </div>
      </nav>
    </header>
  );
}
