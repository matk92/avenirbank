import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getRequestLanguage } from "@/lib/i18n-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://avenirbank.example.com"),
  title: {
    default: "Avenir Bank | Banque digitale responsable",
    template: "%s | Avenir Bank",
  },
  description:
    "Plateforme bancaire nouvelle génération pour piloter vos comptes, épargne et investissements en toute sérénité.",
  alternates: {
    canonical: "/",
    languages: {
      fr: "/",
      en: "/en",
    },
  },
  openGraph: {
    title: "Avenir Bank",
    description:
      "Application bancaire moderne pour suivre vos comptes, votre épargne et vos investissements.",
    url: "https://avenirbank.example.com",
    siteName: "Avenir Bank",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avenir Bank",
    description:
      "Plateforme bancaire nouvelle génération pour piloter vos comptes, épargne et investissements en toute sérénité.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();
  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
