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

function deny(res: Response, msg = "Forbidden") {
  res.status(403).json({ error: msg });
}

function unauthed(res: Response) {
  res.status(401).json({ error: "Unauthorized" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (!PORTAL_ROLES.includes(req.user?.role ?? "")) { deny(res); return; }
  next();
}

export function requireMainAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (req.user?.role !== "main_admin") { deny(res); return; }
  next();
}

export function requireFinanceAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (!FINANCE_ROLES.includes(req.user?.role ?? "")) {
    deny(res, "Finance access restricted"); return;
  }
  next();
}

export function requireFinanceEdit(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (req.user?.role !== "finance_head") {
    deny(res, "Only the Finance Head can modify financial records"); return;
  }
  next();
}

export function requirePeopleEdit(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Leaders and above can add/edit people"); return;
  }
  next();
}

export function requirePeopleDelete(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Ministers and above can remove people"); return;
  }
  next();
}

export function requireAnnouncementCreate(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Leaders and above can create announcements"); return;
  }
  next();
}

export function requireStorageView(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const blocked = ["member", "guest"];
  if (blocked.includes(req.user?.role ?? "")) {
    deny(res, "Members cannot access storage"); return;
  }
  next();
}

export function requireStorageAdd(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Leaders and ministers can upload to storage"); return;
  }
  next();
}

export function requireStorageEdit(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Insufficient permissions to edit storage items"); return;
  }
  next();
}

export function requireStorageDelete(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (req.user?.role !== "main_admin") {
    deny(res, "Only the Main Pastor can delete from storage"); return;
  }
  next();
}

export function requireAttendanceRecord(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  const allowed = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
  if (!allowed.includes(req.user?.role ?? "")) {
    deny(res, "Only designated leaders can record attendance"); return;
  }
  next();
}

export function requireNotGuest(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) { unauthed(res); return; }
  if (req.user?.role === "guest") {
    deny(res, "Guests cannot access this resource"); return;
  }
  next();
}
