import { enMessages } from "./messages/en";
import { koMessages } from "./messages/ko";

export const locales = ["en", "ko"] as const;

export type Locale = (typeof locales)[number];
export type Messages = typeof enMessages;

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
