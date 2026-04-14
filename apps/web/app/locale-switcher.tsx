"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { localeCookieName, type Locale, locales } from "../lib/i18n";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  localeNames: Record<Locale, string>;
};

export function LocaleSwitcher({ locale, label, localeNames }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(nextLocale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLocale);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function switchLocale(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div aria-label={label} className="locale-switcher" role="group">
      {locales.map((item) => (
        <a
          aria-current={item === locale ? "true" : undefined}
          className={item === locale ? "segment segment-active" : "segment"}
          href={buildHref(item)}
          key={item}
          onClick={() => switchLocale(item)}
        >
          {localeNames[item]}
        </a>
      ))}
    </div>
  );
}
