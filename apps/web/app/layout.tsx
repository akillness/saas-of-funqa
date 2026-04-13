import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
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

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/search", label: "Search" },
  { href: "/rag-lab", label: "RAG Lab" },
  { href: "/admin", label: "Admin" },
  { href: "/docs", label: "API Docs" },
  { href: "/login", label: "Login" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable} ${mono.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="page-chrome">
          <header className="site-header">
            <Link className="brand-lockup" href="/">
              <span className="brand-mark" aria-hidden="true">
                fq
              </span>
              <span>
                <span className="eyebrow">Grounded AI Workspace</span>
                <span className="site-title">funqa</span>
              </span>
            </Link>
            <nav aria-label="Primary">
              <ul className="nav-list">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>
          <main id="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
