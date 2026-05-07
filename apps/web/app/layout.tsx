import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter, Noto_Sans_KR } from "next/font/google";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { FirebaseAnalytics } from "./firebase-analytics";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";
import { CategoryTabBar } from "@/components/category-tab-bar";
import { BookIcon, FlaskIcon, HomeIcon, MenuIcon, SearchIcon, ShieldIcon } from "@/components/menu-icons";
import { getDictionary, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"]
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const korean = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-korean",
  weight: ["400", "500", "700"]
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"]
});

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
    { href: "/admin", label: t.layout.nav.admin, Icon: ShieldIcon },
    { href: "/docs", label: t.layout.nav.docs, Icon: BookIcon },
  ];

  return (
    <html lang={locale}>
      <body
        className={`${heading.variable} ${body.variable} ${korean.variable} ${mono.variable}`}
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
          <div className="page-chrome">
            <header className="site-header">
              <Link className="brand-lockup" href={withLocale("/", locale)}>
                <span className="brand-mark" aria-hidden="true">
                  fq
                </span>
                <span>
                  <span className="eyebrow">{t.layout.brandEyebrow}</span>
                  <span className="site-title">funqa</span>
                </span>
              </Link>
              <details className="site-menu">
                <summary className="site-menu-toggle">
                  <MenuIcon className="site-menu-toggle-icon" />
                  <span className="sr-only">{t.layout.menuLabel}</span>
                </summary>
                <div className="site-menu-panel">
                  <section className="menu-panel-section">
                    <p className="menu-panel-heading">{t.layout.menuLabel}</p>
                    <nav aria-label="Primary">
                      <ul className="nav-list nav-list-side menu-nav-list">
                        {navItems.map((item) => (
                          <li key={item.href}>
                            <Link className="menu-nav-link" href={withLocale(item.href, locale)}>
                              <span className="menu-nav-icon" aria-hidden="true">
                                <item.Icon />
                              </span>
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </section>
                  <section className="menu-panel-section">
                    <p className="menu-panel-heading">
                      {t.common.localeLabel} / {t.common.themeLabel}
                    </p>
                    <div className="site-menu-controls">
                      <NavAuth
                        accountLabel={locale === "ko" ? "계정" : "Account"}
                        loginHref={withLocale("/login", locale)}
                        loginLabel={t.layout.nav.login}
                        logoutLabel={locale === "ko" ? "로그아웃" : "Sign out"}
                      />
                      <LocaleSwitcher
                        label={t.common.localeLabel}
                        locale={locale}
                        localeNames={t.common.localeNames}
                      />
                      <ThemeToggle label={t.common.themeLabel} modes={t.common.themeModes} />
                    </div>
                  </section>
                </div>
              </details>
            </header>
            <Suspense fallback={null}>
              <CategoryTabBar locale={locale} />
            </Suspense>
            <main id="main-content">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
