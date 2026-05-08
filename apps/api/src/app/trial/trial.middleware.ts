import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { TrialService } from './trial.service';

const RECOVERY_HEADER = 'x-mgl-trial-recovery';

@Injectable()
export class TrialMiddleware implements NestMiddleware {
  constructor(
    private readonly trial: TrialService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.trial.isTrialModeEnabled()) {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const url = (req.originalUrl ?? req.url ?? '').split('?')[0];

    if (url.startsWith('/api/trial/manage')) {
      const token = req.headers[RECOVERY_HEADER] as string | undefined;
      const expected = this.config.get<string>('TRIAL_ADMIN_TOKEN', '').trim();
      if (!expected) {
        throw new UnauthorizedException('Trial recovery is not configured');
      }
      if (!token || token !== expected) {
        res.status(401).json({ message: 'Invalid recovery token' });
        return;
      }
      next();
      return;
    }

    if (req.method === 'GET' && url === '/api/trial/status') {
      next();
      return;
    }

    const expired = await this.trial.isExpired();
    if (expired) {
      res.status(403).json({
        statusCode: 403,
        message: 'TRIAL_EXPIRED',
        error:
          'Trial period has ended. Please contact Malgray Labs for activation.',
      });
      return;
    }

    next();
  }
}
