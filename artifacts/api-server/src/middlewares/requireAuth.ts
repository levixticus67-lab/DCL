import { type Request, type Response, type NextFunction } from "express";

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
  const role = req.user?.role;
  if (role !== "main_admin" && role !== "leader") {
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
