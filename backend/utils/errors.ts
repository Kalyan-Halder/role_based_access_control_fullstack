import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err?.statusCode || 500;
  const message = err?.message || "Server error";
  res.status(status).json({ message });
}

export function asyncHandler(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
