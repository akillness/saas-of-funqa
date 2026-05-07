"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "../lib/i18n";

type Props = {
  locale: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  all: "var(--arc-sunset-start)",
  games: "var(--color-games)",
  movies: "var(--color-movies)",
  videos: "var(--color-videos)",
};

export function CategoryTabBar({ locale }: Props) {
  const searchParams = useSearchParams();
  const activeSource = searchParams.get("source") ?? "all";
  const t = getDictionary(locale === "ko" ? "ko" : "en");

  const tabs = [
    { value: "all", label: t.categoryTabs.all, href: `/search?lang=${locale}` },
    { value: "games", label: t.categoryTabs.games, href: `/search?source=games&lang=${locale}` },
    { value: "movies", label: t.categoryTabs.movies, href: `/search?source=movies&lang=${locale}` },
    { value: "videos", label: t.categoryTabs.videos, href: `/search?source=videos&lang=${locale}` },
  ] as const;

  return (
    <nav className="category-tab-bar" aria-label={t.search.sourceLabel}>
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          data-category={tab.value}
          className={`category-tab${activeSource === tab.value ? " category-tab--active" : ""}`}
        >
          <span
            className="category-dot"
            aria-hidden="true"
            style={{ background: CATEGORY_COLORS[tab.value] }}
          />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
