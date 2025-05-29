import { NextFunction, RequestHandler, Response } from 'express';
import { RequestWithUser, Role } from '@/types';

export function requireRole(role: Role): RequestHandler {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ success: false, error: `Access denied: requires role '${role}'` });
      return;
    }
    next();
  };
}
