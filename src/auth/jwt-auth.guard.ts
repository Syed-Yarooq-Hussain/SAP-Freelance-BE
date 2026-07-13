import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const message =
        err?.message ||
        info?.message ||
        this.getJwtErrorMessage(info) ||
        'Unauthorized';

      this.logger.warn({
        message: 'JWT authentication failed',
        path: request.originalUrl || request.url,
        method: request.method,
        hasAuthHeader: Boolean(request.headers?.authorization),
        reason: message,
      });

      throw new UnauthorizedException(message);
    }

    return user;
  }

  private getJwtErrorMessage(info: any): string | null {
    if (!info) return null;

    if (info.name === 'TokenExpiredError') {
      return 'Token expired. Please login again.';
    }

    if (info.name === 'JsonWebTokenError') {
      return info.message || 'Invalid token.';
    }

    if (info.name === 'NotBeforeError') {
      return 'Token is not active yet.';
    }

    return info.name || null;
  }
}
