import { enMessages } from "./messages/en";
import { koMessages } from "./messages/ko";

export const locales = ["en", "ko"] as const;

export type Locale = (typeof locales)[number];
export type Messages = typeof enMessages;
export type SearchCategory = "games" | "movies" | "videos";
export type SearchConfidence = "high" | "medium" | "low";
export type SearchResult = {
  title: string;
  source: string;
  category: SearchCategory;
  confidence: SearchConfidence;
  freshness: string;
  snippet: string;
  citations: readonly string[];
};

export const localeCookieName = "funqa-locale";
export const localeHeaderName = "x-funqa-locale";

type LocaleParams = Record<string, string | number | boolean | null | undefined>;

export function resolveLocale(value?: string | null): Locale {
  return value === "ko" ? "ko" : "en";
}

export function getDictionary(locale: Locale): Messages {
  return (locale === "ko" ? koMessages : enMessages) as Messages;
}

export function withLocale(path: string, locale: Locale, params?: LocaleParams): string {
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  searchParams.set("lang", locale);
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function normalizeConfidence(value?: string | null): SearchConfidence {
  if (value === "high" || value === "medium") {
    return value;
  }

  return "low";
}
