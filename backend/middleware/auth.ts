import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { HttpError, asyncHandler } from "../utils/errors";

export type AuthReq = any & { user?: { id: string; role: string } };

export const requireAuth = asyncHandler(async (req: AuthReq, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing token");
  }

  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET || "dev_secret";

  let payload: any;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    throw new HttpError(401, "Invalid token");
  }

  const user = await User.findById(payload.sub).select("role status");
  if (!user) throw new HttpError(401, "User not found");
  if ((user as any).status !== "ACTIVE") throw new HttpError(401, "User inactive");

  req.user = { id: String(user._id), role: (user as any).role };
  next();
});

export function requireAdmin(req: AuthReq, res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, "Unauthorized"));
  if (req.user.role !== "ADMIN") return next(new HttpError(403, "Admin only"));
  next();
}
