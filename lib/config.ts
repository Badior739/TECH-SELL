export const config = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "TechShop BF",
  tagline:
    process.env.NEXT_PUBLIC_TAGLINE ||
    "Ordinateurs, écrans et accessoires informatiques",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "22600000000").replace(/\D/g, ""),
  phone: process.env.NEXT_PUBLIC_PHONE || "",
  email: process.env.NEXT_PUBLIC_EMAIL || "",
  city: process.env.NEXT_PUBLIC_CITY || "Ouagadougou, Burkina Faso",
  shippingInfo:
    process.env.NEXT_PUBLIC_SHIPPING_INFO ||
    "Livraison dès 1 500 FCFA à Ouaga, gratuite dès 50 000 FCFA",
  currency: "FCFA",
};

const COUNTRY_CODE = (process.env.NEXT_PUBLIC_COUNTRY_CODE || "226").replace(/\D/g, "");

// Normalise un numéro local (8 chiffres) en format international pour wa.me
export function intlNumber(number: string): string {
  const digits = number.replace(/\D/g, "").replace(/^00/, "");
  return digits.length <= 8 ? COUNTRY_CODE + digits : digits;
}

export function waLink(text: string, number: string = config.whatsapp) {
  return `https://wa.me/${intlNumber(number)}?text=${encodeURIComponent(text)}`;
}
