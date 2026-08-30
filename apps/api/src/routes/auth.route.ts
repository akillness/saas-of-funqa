import type { Express } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export function registerAuthRoute(app: Express) {
  app.get("/v1/auth/session", (req, res) => {
    const authReq = req as AuthenticatedRequest;
    res.json({ authenticated: true, isAdmin: authReq.isAdmin === true });
  });
}
