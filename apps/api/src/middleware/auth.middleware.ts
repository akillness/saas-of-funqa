import type { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (process.env.DISABLE_AUTH === "true") {
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
    const decoded = await getAuth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}
