import type { User } from "firebase/auth";

export type BrowserSessionRole = {
  authenticated: true;
  isAdmin: boolean;
};

export async function establishBrowserSession(user: User): Promise<BrowserSessionRole> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }
  });
  if (!response.ok) throw new Error("Unable to establish the server session.");
  const payload = (await response.json()) as Partial<BrowserSessionRole>;
  if (payload.authenticated !== true || typeof payload.isAdmin !== "boolean") {
    throw new Error("The server session response was invalid.");
  }
  return payload as BrowserSessionRole;
}

export async function clearBrowserSession(): Promise<void> {
  const response = await fetch("/api/auth/session", { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to clear the server session.");
}
