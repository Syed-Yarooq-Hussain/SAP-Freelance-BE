import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomResponse } from 'src/utils/CustomResponse';
import { CustomError } from './custom-error.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorBody = {
      message: 'Internal server error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    if (exception instanceof CustomError) {
      errorBody.message = exception.message;
      errorBody.code = exception.getStatus();
    } else if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      errorBody.message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message || exception.message
          : exceptionResponse;
      errorBody.code = exception.getStatus();
    }

    if (!(exception instanceof HttpException) && exception instanceof Error) {
      errorBody.message = exception.message;
    }

    return CustomResponse.error(response, errorBody);
  }
}
