import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response: any = {
          code: 200,
          status: 'success',
          message: data?.message || 'Request successful',
          data: data?.data ?? data,
        };

        if (data?.pagination) {
          response.pagination = data.pagination;
        }

        return response;
      }),
    );
  }
}
