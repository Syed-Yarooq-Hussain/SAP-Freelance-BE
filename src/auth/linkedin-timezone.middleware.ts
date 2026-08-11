import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LinkedInTimezoneMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const timezone = typeof req.query.timezone === 'string'
      ? req.query.timezone.trim()
      : '';

    if (!timezone) return next();

    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException(
        'Timezone must be a valid IANA timezone, e.g. Europe/Berlin',
      );
    }

    (req.session as any).linkedinTimezone = timezone;
    next();
  }
}
