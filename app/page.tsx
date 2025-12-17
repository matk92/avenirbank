import type { Metadata } from "next";
import HomeLanding from "@/components/templates/HomeLanding";
import { getHomeMetrics } from "@/lib/server/home-metrics";

export const metadata: Metadata = {
  title: "Avenir Bank — Banque digitale responsable",
  description:
    "Pilotez vos comptes, votre épargne et vos investissements avec une expérience sécurisée et responsable.",
  alternates: {
    canonical: "/",
    languages: {
      fr: "/",
      en: "/en",
    },
  },
};

export default function Home() {
  const metricsPromise = getHomeMetrics();
  return <HomeLanding metricsPromise={metricsPromise} />;
}
