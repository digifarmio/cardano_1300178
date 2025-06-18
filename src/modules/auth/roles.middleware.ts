import { NextFunction, RequestHandler, Response } from 'express';
import { RequestWithUser, Role } from '@/types';

export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ success: false, error: 'Access denied: authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied: requires one of these roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
