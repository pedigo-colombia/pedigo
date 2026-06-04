import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
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

export const metadata: Metadata = {
  title: "PediGo · Plataforma para restaurantes",
  description:
    "Domicilios, pedidos por WhatsApp, facturación DIAN y operación diaria para restaurantes en Colombia.",
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
