import { NextFunction, Response } from 'express';
import { TokenService } from '@/modules/auth/token.service';
import { RequestWithUser } from '@/types';

export class TokenController {
  constructor(private readonly tokenService = new TokenService()) {
    this.issueAdminToken = this.issueAdminToken.bind(this);
    this.issueUserToken = this.issueUserToken.bind(this);
  }

  async issueAdminToken(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const token = this.tokenService.issueAdminToken();
      res.json({ success: true, token });
    } catch (error) {
      next(error);
    }
  }

  async issueUserToken(req: RequestWithUser, res: Response, next: NextFunction) {
    const { fields } = req.body;
    if (!Array.isArray(fields) || !fields.every((f) => typeof f === 'string')) {
      res.status(400).json({ error: 'Fields must be an array of strings' });
      return;
    }

    try {
      const token = this.tokenService.issueUserToken(fields);
      res.json({ success: true, token });
    } catch (error) {
      next(error);
    }
  }
}
