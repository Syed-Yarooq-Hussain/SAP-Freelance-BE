import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    console.error('Auth Exception:', {
      status,
      message,
      exception,
    });

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'object' ? message['message'] : message,
      timestamp: new Date().toISOString(),
    });
  }
}
