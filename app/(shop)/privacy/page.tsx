import { config } from "@/lib/config";

export const metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-2xl py-6">
      <h1 className="text-2xl font-extrabold text-ink">Politique de confidentialité</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        {config.name} collecte uniquement les informations nécessaires au traitement de vos commandes : nom,
        numéro de téléphone, adresse de livraison et contenu de la commande.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Ces données servent à vous livrer, à vous contacter au sujet de votre commande et, si vous l&apos;acceptez, à
        vous informer de nos promotions par WhatsApp. Elles ne sont ni vendues ni cédées à des tiers.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Pour ne plus recevoir de promotions ou demander la suppression de vos données, écrivez-nous sur WhatsApp
        au {config.whatsapp ? `+${config.whatsapp}` : "numéro de la boutique"}.
      </p>
    </article>
  );
}
