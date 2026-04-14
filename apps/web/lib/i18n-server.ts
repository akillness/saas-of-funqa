import { cookies, headers } from "next/headers";
import { localeCookieName, localeHeaderName, resolveLocale } from "./i18n";

export async function getRequestLocale() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  return resolveLocale(
    headerStore.get(localeHeaderName) ?? cookieStore.get(localeCookieName)?.value ?? "en"
  );
}
