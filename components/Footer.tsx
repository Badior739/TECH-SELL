import Link from "next/link";
import { config } from "@/lib/config";
import SubscribeForm from "./SubscribeForm";

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-slate-300">
      <div className="container-x grid gap-8 py-10 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">{config.name}</h3>
          <p className="mt-2 text-sm">{config.tagline}. Garantie, conseils et livraison rapide.</p>
          <p className="mt-3 text-xs text-slate-400">Paiement : Orange Money · Moov Money · Coris Money · à la livraison</p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-white">Nous contacter</h4>
          <ul className="mt-2 space-y-1">
            <li>{config.city}</li>
            {config.phone && <li>{config.phone}</li>}
            <li>WhatsApp 7j/7</li>
            {config.email && <li>{config.email}</li>}
          </ul>
          <Link href="/privacy" className="mt-3 inline-block text-xs underline">
            Politique de confidentialité
          </Link>
        </div>
        <div>
          <h4 className="font-semibold text-white">Promos WhatsApp</h4>
          <p className="mb-3 mt-2 text-sm">Recevez les ventes flash en avant-première.</p>
          <SubscribeForm />
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {config.name}
      </div>
    </footer>
  );
}
