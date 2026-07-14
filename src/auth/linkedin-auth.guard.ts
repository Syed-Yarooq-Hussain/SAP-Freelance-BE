import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
  private readonly logger = new Logger(LinkedInAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const message =
        err?.message ||
        info?.message ||
        info?.error_description ||
        info?.error ||
        'LinkedIn authentication failed';

      this.logger.warn({
        message: 'LinkedIn authentication failed',
        path: request.originalUrl || request.url,
        method: request.method,
        query: request.query,
        reason: message,
      });

      throw new UnauthorizedException(message);
    }

    return user;
  }
}
