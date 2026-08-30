import { resolveLocale, withLocale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { LoginClient } from "./login-client";

const allowedDestinations = new Set([
  "/scene-search",
  "/vector-index",
  "/corpus",
  "/rag-lab",
  "/admin",
  "/docs"
]);

type LoginPageProps = {
  searchParams?: Promise<{ from?: string; lang?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const returnPath =
    params?.from && allowedDestinations.has(params.from) ? params.from : "/scene-search";

  return <LoginClient destination={withLocale(returnPath, locale)} locale={locale} />;
}
