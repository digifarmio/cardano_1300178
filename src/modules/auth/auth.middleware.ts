import { NextFunction, Response } from 'express';
import { JwtService } from '@/modules/core/jwt.service';
import { RequestWithUser } from '@/types';

const jwtService = new JwtService();

export async function authenticate(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwtService.verify(token);
    req.user = { role: payload.role, fields: payload.fields };
    next();
  } catch (err) {
    next(err);
  }
}
