import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { FirebaseAnalytics } from "./firebase-analytics";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";
import { CategoryTabBar } from "@/components/category-tab-bar";
import { BookIcon, FlaskIcon, HomeIcon, RalphIcon, SearchIcon, ShieldIcon } from "@/components/menu-icons";
import { getDictionary, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "funqa",
  description: "An all-knowledge AI search engine with grounded retrieval, citations, and visible evidence.",
  metadataBase: new URL("https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app"),
  openGraph: {
    title: "funqa",
    description: "An all-knowledge AI search engine with grounded retrieval, citations, and visible evidence.",
    images: ["/opengraph-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "funqa",
    description: "An all-knowledge AI search engine with grounded retrieval, citations, and visible evidence.",
    images: ["/twitter-image.png"],
  },
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
    { href: "/rag-lab", label: t.layout.nav.ragLab, Icon: FlaskIcon },
    { href: "/ralph", label: t.layout.nav.ralph, Icon: RalphIcon },
    { href: "/admin", label: t.layout.nav.admin, Icon: ShieldIcon },
    { href: "/docs", label: t.layout.nav.docs, Icon: BookIcon },
  ];

  return (
    <html lang={locale}>
      <body
        data-locale={locale}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('funqa-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.body.dataset.theme=t;}catch(e){document.body.dataset.theme='light';}"
          }}
        />
        <FirebaseAnalytics />
        <a className="skip-link" href="#main-content">
          {t.layout.skipToContent}
        </a>
        <AuthProvider>
          <div className="arc-layout" style={{ background: 'transparent' }}>
            <aside className="arc-sidebar" id="arc-sidebar" style={{ background: 'rgba(10, 10, 15, 0.45)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(0, 255, 204, 0.2)', boxShadow: '4px 0 30px rgba(0,0,0,0.5)' }}>
              <Link className="arc-sidebar-brand brand-lockup" href={withLocale("/", locale)}>
                <span className="brand-mark" aria-hidden="true" style={{ background: 'linear-gradient(135deg, var(--gm-accent-neon), var(--gm-accent-cyber))', boxShadow: '0 0 15px var(--gm-accent-neon)' }}>
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
                  <ThemeToggle label={t.common.themeLabel} modes={t.common.themeModes} />
                </div>
              </div>
            </aside>

            <div className="arc-content">
              <header className="site-header arc-content-header" style={{ background: 'rgba(15, 15, 22, 0.55)', backdropFilter: 'blur(24px)', border: '1px solid rgba(0, 255, 204, 0.15)', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
                <Link className="brand-lockup arc-mobile-brand" href={withLocale("/", locale)}>
                  <span className="brand-mark" aria-hidden="true" style={{ background: 'linear-gradient(135deg, var(--gm-accent-neon), var(--gm-accent-cyber))' }}>
                    fq
                  </span>
                  <span className="site-title" style={{ textShadow: '0 0 8px rgba(0,255,204,0.5)' }}>funqa</span>
                </Link>
                <div className="site-header-actions">
                  <NavAuth
                    accountLabel={locale === "ko" ? "계정" : "Account"}
                    loginHref={withLocale("/login", locale)}
                    loginLabel={t.layout.nav.login}
                    logoutLabel={locale === "ko" ? "로그아웃" : "Sign out"}
                  />
                  <ThemeToggle label={t.common.themeLabel} modes={t.common.themeModes} />
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
