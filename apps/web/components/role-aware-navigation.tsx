"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, CorpusIcon, FilmIcon, FlaskIcon, LayersIcon, ShieldIcon } from "./menu-icons";
import { useAuth } from "./auth-provider";
import { withLocale, type Locale } from "@/lib/i18n";

const userItems = [{ href: "/scene-search", key: "search", Icon: FilmIcon }] as const;
const adminItems = [
  { href: "/vector-index", key: "vectorIndex", Icon: LayersIcon },
  { href: "/corpus", key: "corpus", Icon: CorpusIcon },
  { href: "/rag-lab", key: "ragLab", Icon: FlaskIcon },
  { href: "/admin", key: "admin", Icon: ShieldIcon },
  { href: "/docs", key: "docs", Icon: BookIcon }
] as const;

type Labels = Record<
  (typeof userItems)[number]["key"] | (typeof adminItems)[number]["key"],
  string
>;

export function RoleAwareNavigation({ locale, labels }: { locale: Locale; labels: Labels }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...userItems, ...adminItems] : userItems;

  return (
    <nav className="site-menu-nav" aria-label={locale === "ko" ? "주 메뉴" : "Primary"}>
      {items.map((item) => (
        <Link
          aria-current={pathname === item.href ? "page" : undefined}
          className="site-menu-link"
          href={withLocale(item.href, locale)}
          key={item.href}
        >
          <span className="site-menu-link-icon" aria-hidden="true">
            <item.Icon />
          </span>
          <span>{labels[item.key]}</span>
        </Link>
      ))}
    </nav>
  );
}
