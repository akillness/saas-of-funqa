"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "../lib/i18n";

type Props = {
  locale: string;
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
          className={`category-tab${activeSource === tab.value ? " category-tab--active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
