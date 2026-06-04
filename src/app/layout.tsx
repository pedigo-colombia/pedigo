import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { brandAssets } from "@/lib/brand/assets";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "PediGo · Plataforma para restaurantes",
  description:
    "Domicilios, pedidos por WhatsApp, facturación DIAN y operación diaria para restaurantes en Colombia.",
  icons: {
    icon: [
      { url: brandAssets.isotipo, type: "image/svg+xml" },
      { url: brandAssets.isotipoPng, sizes: "512x512", type: "image/png" },
    ],
    apple: brandAssets.icon512,
  },
  openGraph: {
    title: "PediGo",
    description:
      "Domicilios, pedidos y facturación para restaurantes en Colombia.",
    type: "website",
    locale: "es_CO",
    images: [
      {
        url: brandAssets.icon512,
        width: 512,
        height: 512,
        alt: "PediGo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "PediGo",
    images: [brandAssets.icon512],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${nunito.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
