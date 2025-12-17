import { cookies, headers } from 'next/headers';
import { defaultLanguage, isLanguage, translate } from '@/lib/i18n';
import type { Language, TranslationKey } from '@/lib/i18n';

type TranslationParams = Record<string, string | number>;

async function getHeadersSafe(): Promise<Headers> {
  const h = headers() as unknown;
  // Next 16: headers() is async. Older versions: sync.
  if (h && typeof (h as Promise<unknown>).then === 'function') {
    return (await h) as Headers;
  }
  return h as Headers;
}

async function getCookiesSafe() {
  const c = cookies() as unknown;
  // Next 16: cookies() is async. Older versions: sync.
  if (c && typeof (c as Promise<unknown>).then === 'function') {
    return (await c) as ReturnType<typeof cookies>;
  }
  return c as ReturnType<typeof cookies>;
}

async function detectLanguageFromHeaders(): Promise<Language> {
  const h = await getHeadersSafe();
  const accept = h.get('accept-language') ?? '';
  const primary = accept.split(',')[0]?.trim().slice(0, 2);
  return isLanguage(primary) ? primary : defaultLanguage;
}

export async function getRequestLanguage(): Promise<Language> {
  const c = await getCookiesSafe();
  const cookieLang = c.get('language')?.value;
  if (isLanguage(cookieLang)) {
    return cookieLang;
  }
  return await detectLanguageFromHeaders();
}

export async function getServerT() {
  const language = await getRequestLanguage();
  return {
    language,
    t: (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
  };
}


