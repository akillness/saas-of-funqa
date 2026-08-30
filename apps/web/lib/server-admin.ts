import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFunqaApiBaseUrl } from "./funqa-api";
import { withLocale, type Locale } from "./i18n";

const sessionCookieName = "funqa-id-token";

export async function requireServerAdmin(locale: Locale, returnPath: string) {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) {
    redirect(withLocale("/login", locale, { from: returnPath }));
  }

  const response = await fetch(`${getFunqaApiBaseUrl()}/v1/auth/session`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => null);
  if (!response?.ok) {
    redirect(withLocale("/login", locale, { from: returnPath }));
  }

  const payload = (await response.json()) as { authenticated?: unknown; isAdmin?: unknown };
  if (payload.authenticated !== true) {
    redirect(withLocale("/login", locale, { from: returnPath }));
  }
  if (payload.isAdmin !== true) {
    redirect(withLocale("/scene-search", locale));
  }

  return { idToken: token };
}
