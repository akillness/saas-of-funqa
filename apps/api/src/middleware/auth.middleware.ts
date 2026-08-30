import type { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { config } from "../config.js";
import { getFirebaseApp } from "../firebase.js";

export interface AuthenticatedRequest extends Request {
  uid?: string;
  email?: string;
  isAdmin?: boolean;
}

function hasAdminRole(decoded: DecodedIdToken): boolean {
  const adminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase())
    : [];
  const isAdminByEmail =
    decoded.email_verified === true &&
    Boolean(decoded.email && adminEmails.includes(decoded.email.toLowerCase()));
  return isAdminByEmail || decoded.admin === true;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (config.disableAuth) {
    (req as AuthenticatedRequest).isAdmin = true;
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token);
    const authReq = req as AuthenticatedRequest;
    authReq.uid = decoded.uid;
    authReq.email = decoded.email;
    authReq.isAdmin = hasAdminRole(decoded);
    next();
  } catch (e) {
    console.warn("[auth] verifyIdToken failed:", e instanceof Error ? e.message : e);
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (config.disableAuth) {
    (req as AuthenticatedRequest).isAdmin = true;
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token);
    if (hasAdminRole(decoded)) {
      const authReq = req as AuthenticatedRequest;
      authReq.uid = decoded.uid;
      authReq.email = decoded.email;
      authReq.isAdmin = true;
      next();
    } else {
      res.status(403).json({ error: "Forbidden", message: "Admin role required." });
    }
  } catch (e) {
    console.warn(
      "[auth] verifyIdToken failed for admin route:",
      e instanceof Error ? e.message : e
    );
    res.status(403).json({ error: "Invalid or expired token" });
  }
}
