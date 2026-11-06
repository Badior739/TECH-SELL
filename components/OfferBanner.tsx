import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import type { Offer } from "@/lib/types";
import Countdown from "./Countdown";

export default function OfferBanner({ offer }: { offer: Offer }) {
  return (
    <section className="offer-hero" aria-label={`Promotion en cours : ${offer.title}`}>
      <div className="offer-hero-content">
        <span className="offer-eyebrow"><Sparkles size={14} /> Offre en cours</span>
        <h2>{offer.title}</h2>
        <p>Profitez de <strong>{offer.percent}% de réduction</strong> sur notre sélection. La remise est appliquée automatiquement.</p>
        <div className="offer-deadline">
          <Clock3 size={15} aria-hidden="true" />
          <span>Se termine dans</span>
          <strong><Countdown endsAt={offer.ends_at} compact /></strong>
        </div>
      </div>
      <div className="offer-hero-discount" aria-label={`${offer.percent} pour cent de réduction`}>
        <span>JUSQU’À</span>
        <strong><span>−</span>{offer.percent}<small>%</small></strong>
        <span>DE RÉDUCTION</span>
      </div>
      <Link href="/categorie/tous?promo=1" className="offer-hero-cta">
        Voir les offres <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
