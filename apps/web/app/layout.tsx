import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans, Noto_Sans_KR } from "next/font/google";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { FirebaseAnalytics } from "./firebase-analytics";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";
import { CategoryTabBar } from "@/components/category-tab-bar";
import { getDictionary, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
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
  description: "Grounded repository intelligence with a premium search workspace and operator console."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const navItems = [
    { href: "/", label: t.layout.nav.overview },
    { href: "/search", label: t.layout.nav.search },
    { href: "/rag-lab", label: t.layout.nav.ragLab },
    { href: "/admin", label: t.layout.nav.admin },
    { href: "/docs", label: t.layout.nav.docs },
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
                  <span className="site-menu-toggle-lines" aria-hidden="true" />
                  <span>{t.layout.menuLabel}</span>
                </summary>
                <div className="site-menu-panel">
                  <nav aria-label="Primary">
                    <ul className="nav-list nav-list-side">
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <Link href={withLocale(item.href, locale)}>{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="site-menu-controls">
                    <NavAuth />
                    <LocaleSwitcher
                      label={t.common.localeLabel}
                      locale={locale}
                      localeNames={t.common.localeNames}
                    />
                    <ThemeToggle label={t.common.themeLabel} modes={t.common.themeModes} />
                  </div>
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
