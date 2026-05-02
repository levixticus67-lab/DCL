import { type Request, type Response, type NextFunction } from "express";

const PORTAL_ROLES = [
  "main_admin",
  "pastor",
  "minister",
  "finance_head",
  "branch_head",
  "leader",
];
const FINANCE_ROLES = ["main_admin", "finance_head"];

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!PORTAL_ROLES.includes(req.user?.role ?? "")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireMainAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user?.role !== "main_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireFinanceAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!FINANCE_ROLES.includes(req.user?.role ?? "")) {
    res.status(403).json({ error: "Forbidden — Finance access only" });
    return;
  }
  next();
}
