import { unstable_cache } from 'next/cache';

export type HomeMetrics = {
  volumeManagedEur: number;
  nps: number;
  vsLastMonthPct: number;
};

// Exemple d'usage du cache applicatif Next (Data Cache) pour du contenu "marketing" stable.
// Ici c'est une valeur calculée localement, mais le même pattern s'applique à une API externe.
export const getHomeMetrics = unstable_cache(
  async (): Promise<HomeMetrics> => {
    return {
      volumeManagedEur: 128_450_000,
      nps: 68,
      vsLastMonthPct: 4.8,
    };
  },
  ['home-metrics:v1'],
  { revalidate: 60 * 60 },
);


