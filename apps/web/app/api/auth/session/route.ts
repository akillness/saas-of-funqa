import { NextRequest, NextResponse } from "next/server";
import { getFunqaApiBaseUrl } from "@/lib/funqa-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionCookieName = "funqa-id-token";
const cookieOptions = {
  httpOnly: true,
  maxAge: 50 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const token = authorization.slice(7);
  const verification = await fetch(`${getFunqaApiBaseUrl()}/v1/auth/session`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => null);
  if (!verification?.ok) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const payload = (await verification.json()) as { authenticated?: unknown; isAdmin?: unknown };
  if (payload.authenticated !== true || typeof payload.isAdmin !== "boolean") {
    return NextResponse.json({ error: "invalid_role_response" }, { status: 502 });
  }

  const response = NextResponse.json({ authenticated: true, isAdmin: payload.isAdmin });
  response.cookies.set(sessionCookieName, token, cookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set(sessionCookieName, "", { ...cookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
