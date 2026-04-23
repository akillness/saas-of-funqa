"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  locale: string;
};

export function CategoryTabBar({ locale }: Props) {
  const searchParams = useSearchParams();
  const activeSource = searchParams.get("source") ?? "all";

  const tabs = [
    { value: "all", label: "All", href: `/search?lang=${locale}` },
    { value: "games", label: "🎮 Games", href: `/search?source=games&lang=${locale}` },
    { value: "movies", label: "🎬 Movies", href: `/search?source=movies&lang=${locale}` },
    { value: "videos", label: "📱 Videos", href: `/search?source=videos&lang=${locale}` },
  ] as const;

  return (
    <nav className="category-tab-bar" aria-label="Content categories">
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
