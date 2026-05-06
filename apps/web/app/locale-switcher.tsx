"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { EnglishIcon, GlobeIcon, KoreanIcon } from "@/components/menu-icons";
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
    <div aria-label={label} className="menu-control-group locale-switcher" role="group">
      <span className="menu-control-icon" aria-hidden="true">
        <GlobeIcon />
      </span>
      {locales.map((item) => (
        <a
          aria-current={item === locale ? "true" : undefined}
          aria-label={localeNames[item]}
          className={item === locale ? "icon-segment icon-segment-active" : "icon-segment"}
          href={buildHref(item)}
          key={item}
          onClick={() => switchLocale(item)}
          title={localeNames[item]}
        >
          {item === "ko" ? <KoreanIcon className="icon-segment-glyph" /> : <EnglishIcon className="icon-segment-glyph" />}
          <span className="sr-only">{localeNames[item]}</span>
        </a>
      ))}
    </div>
  );
}
