export type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

export const FETCH_TAGS = {
  config: 'config',
  stocks: 'stocks',
  savingsRate: 'savings-rate',
  activity: 'activity',
  directorClients: 'director-clients',
  directorAccounts: 'director-accounts',
  user: (id: string) => `user:${id}`,
};

type NextCacheConfig = {
  revalidate?: number | false;
  tags?: string[];
};

type FetchInit = RequestInit & { next?: NextCacheConfig };

type JsonResult<T> = Promise<T>;

function mergeInit(base: FetchInit | undefined, override: FetchInit): FetchInit {
  return {
    ...base,
    ...override,
    headers: { ...(base?.headers || {}), ...(override.headers || {}) },
  };
}

export async function fetchStatic<T>(input: RequestInfo | URL, init?: FetchInit): JsonResult<T> {
  const response = await fetch(input, mergeInit(init, { cache: 'force-cache' }));
  return response.json();
}

export async function fetchRevalidated<T>(
  input: RequestInfo | URL,
  options?: { seconds?: number; tags?: string[]; init?: FetchInit },
): JsonResult<T> {
  const { seconds = 60, tags, init } = options || {};
  const response = await fetch(
    input,
    mergeInit(init, {
      next: { revalidate: seconds, tags },
    }),
  );
  return response.json();
}

export async function fetchNoStore<T>(input: RequestInfo | URL, init?: FetchInit): JsonResult<T> {
  const response = await fetch(input, mergeInit(init, { cache: 'no-store' }));
  return response.json();
}