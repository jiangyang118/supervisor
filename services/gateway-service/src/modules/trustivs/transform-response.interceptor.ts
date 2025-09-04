import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StdResponse } from './std-response';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value) => {
        if (value && typeof value === 'object' && 'code' in value && 'message' in value) return value;
        const res: StdResponse = { code: '1', message: 'OK', data: value };
        return res;
      }),
    );
  }
}

