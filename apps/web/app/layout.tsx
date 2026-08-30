import type { Metadata } from "next";
import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { FirebaseAnalytics } from "./firebase-analytics";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";
import { RoleAwareNavigation } from "@/components/role-aware-navigation";
import { getDictionary, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "FunQA · Video Evidence Search",
  description:
    "Search reviewed video-analysis pairs and inspect timestamped frames, retrieval evidence, and grounded answers.",
  metadataBase: new URL("https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app"),
  openGraph: {
    title: "FunQA · Video Evidence Search",
    description:
      "Search reviewed video-analysis pairs and inspect timestamped frames, retrieval evidence, and grounded answers.",
    images: ["/opengraph-image.png"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "FunQA · Video Evidence Search",
    description:
      "Search reviewed video-analysis pairs and inspect timestamped frames, retrieval evidence, and grounded answers.",
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
  const navLabels = {
    search: t.layout.nav.sceneLab,
    vectorIndex: t.layout.nav.vectorIndex,
    corpus: t.layout.nav.corpus,
    ragLab: t.layout.nav.ragLab,
    admin: t.layout.nav.admin,
    docs: t.layout.nav.docs
  };

  return (
    <html lang={locale}>
      <body data-locale={locale} data-theme="light" suppressHydrationWarning>
        <FirebaseAnalytics />
        <a className="skip-link" href="#main-content">
          {t.layout.skipToContent}
        </a>
        <AuthProvider>
          <div className="simple-shell">
            <header className="simple-header">
              <Link
                className="simple-brand brand-lockup"
                href={withLocale("/scene-search", locale)}
              >
                <span className="brand-mark" aria-hidden="true">
                  fq
                </span>
                <span className="site-title">funqa</span>
              </Link>

              <details className="simple-menu">
                <summary aria-haspopup="menu" role="button">
                  <span aria-hidden="true">☰</span>
                  {locale === "ko" ? "메뉴" : "Menu"}
                </summary>
                <div className="simple-menu-panel">
                  <RoleAwareNavigation locale={locale} labels={navLabels} />
                  <div className="simple-menu-controls">
                    <NavAuth
                      accountLabel={locale === "ko" ? "계정" : "Account"}
                      loginHref={withLocale("/login", locale)}
                      loginLabel={t.layout.nav.login}
                      logoutLabel={locale === "ko" ? "로그아웃" : "Sign out"}
                      logoutErrorLabel={
                        locale === "ko"
                          ? "로그아웃하지 못했습니다. 다시 시도하세요."
                          : "Could not sign out. Try again."
                      }
                    />
                    <LocaleSwitcher
                      label={t.common.localeLabel}
                      locale={locale}
                      localeNames={t.common.localeNames}
                    />
                  </div>
                </div>
              </details>
            </header>

            <main className="simple-main" id="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
