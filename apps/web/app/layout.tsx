import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LocaleSwitcher } from "./locale-switcher";
import { FirebaseAnalytics } from "./firebase-analytics";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";
import { CategoryTabBar } from "@/components/category-tab-bar";
import { BookIcon, FilmIcon, FlaskIcon, HomeIcon, SearchIcon, ShieldIcon } from "@/components/menu-icons";
import { getDictionary, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "FunQA · Video QA Analysis",
  description:
    "Analyze video QA scenarios, timestamped scene evidence, and measured FunQA signals in one concise search workspace.",
  metadataBase: new URL("https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app"),
  openGraph: {
    title: "FunQA · Video QA Analysis",
    description:
      "Analyze video QA scenarios, timestamped scene evidence, and measured FunQA signals in one concise search workspace.",
    images: ["/opengraph-image.png"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "FunQA · Video QA Analysis",
    description:
      "Analyze video QA scenarios, timestamped scene evidence, and measured FunQA signals in one concise search workspace.",
    images: ["/twitter-image.png"]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const navItems = [
    { href: "/", label: t.layout.nav.overview, Icon: HomeIcon },
    { href: "/search", label: t.layout.nav.search, Icon: SearchIcon },
    { href: "/scene-search", label: t.layout.nav.sceneLab, Icon: FilmIcon },
    { href: "/rag-lab", label: t.layout.nav.ragLab, Icon: FlaskIcon },
    { href: "/admin", label: t.layout.nav.admin, Icon: ShieldIcon },
    { href: "/docs", label: t.layout.nav.docs, Icon: BookIcon },
  ];

  return (
    <html lang={locale}>
      {/* FunQA ships a single dark analysis theme. `data-theme` is rendered on
          the server so the first paint is already dark: the previous inline
          script resolved the theme after hydration, which flashed the light
          palette on every cold load. */}
      <body data-locale={locale} data-theme="dark" suppressHydrationWarning>
        <FirebaseAnalytics />
        <a className="skip-link" href="#main-content">
          {t.layout.skipToContent}
        </a>
        <AuthProvider>
          <div className="arc-layout">
            <aside className="arc-sidebar" id="arc-sidebar">
              <Link className="arc-sidebar-brand brand-lockup" href={withLocale("/", locale)}>
                <span className="brand-mark" aria-hidden="true">
                  fq
                </span>
                <span>
                  <span className="eyebrow">{t.layout.brandEyebrow}</span>
                  <span className="site-title">funqa</span>
                </span>
              </Link>

              <nav className="arc-sidebar-nav" aria-label="Primary">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    className="arc-sidebar-tab"
                    href={withLocale(item.href, locale)}
                  >
                    <span className="arc-sidebar-tab-icon" aria-hidden="true">
                      <item.Icon />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="arc-sidebar-footer">
                <NavAuth
                  accountLabel={locale === "ko" ? "계정" : "Account"}
                  loginHref={withLocale("/login", locale)}
                  loginLabel={t.layout.nav.login}
                  logoutLabel={locale === "ko" ? "로그아웃" : "Sign out"}
                />
                <div className="site-menu-controls">
                  <LocaleSwitcher
                    label={t.common.localeLabel}
                    locale={locale}
                    localeNames={t.common.localeNames}
                  />
                </div>
              </div>
            </aside>

            <div className="arc-content">
              <header className="site-header arc-content-header">
                <Link className="brand-lockup arc-mobile-brand" href={withLocale("/", locale)}>
                  <span className="brand-mark" aria-hidden="true">
                    fq
                  </span>
                  <span className="site-title">funqa</span>
                </Link>
                <div className="site-header-actions">
                  <NavAuth
                    accountLabel={locale === "ko" ? "계정" : "Account"}
                    loginHref={withLocale("/login", locale)}
                    loginLabel={t.layout.nav.login}
                    logoutLabel={locale === "ko" ? "로그아웃" : "Sign out"}
                  />
                </div>
              </header>

              <Suspense fallback={null}>
                <CategoryTabBar locale={locale} />
              </Suspense>
              <main id="main-content">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
