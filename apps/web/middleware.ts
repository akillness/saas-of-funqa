import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const localeCookieName = "funqa-locale";
const localeHeaderName = "x-funqa-locale";

function resolveLocale(value: string | null) {
  return value === "ko" ? "ko" : "en";
}

export function middleware(request: NextRequest) {
  const locale = resolveLocale(
    request.nextUrl.searchParams.get("lang") ?? request.cookies.get(localeCookieName)?.value ?? "en"
  );
  const headers = new Headers(request.headers);
  headers.set(localeHeaderName, locale);

  const response = NextResponse.next({
    request: {
      headers
    }
  });
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
