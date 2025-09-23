import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomError extends HttpException {
  constructor(statusCode: number = HttpStatus.BAD_REQUEST, message: string) {
    super(message, statusCode);
  }
}
