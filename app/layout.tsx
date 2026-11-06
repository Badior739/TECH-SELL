import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: `${config.name} — ${config.tagline}`, template: `%s · ${config.name}` },
  description: `${config.tagline}. Livraison, garantie, paiement Mobile Money ou à la livraison. ${config.city}.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
  var savedTheme = localStorage.getItem("boutique-theme");
  var initialTheme = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = initialTheme;
  document.documentElement.style.colorScheme = initialTheme;
} catch (error) {
  console.warn("Impossible de lire la préférence de thème enregistrée.", error);
}`}
        </Script>
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
