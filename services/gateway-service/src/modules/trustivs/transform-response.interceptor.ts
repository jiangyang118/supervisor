import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { getTraceId } from '../../common/trace';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StdResponse } from './std-response';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Set X-Trace-Id on response
    try {
      const res = context.switchToHttp().getResponse();
      const req = context.switchToHttp().getRequest();
      const tid = (req && (req.traceId as string)) || getTraceId() || Math.random().toString(36).slice(2, 12);
      res.setHeader('X-Trace-Id', tid);
    } catch {}
    return next.handle().pipe(
      map((value) => {
        if (value && typeof value === 'object' && 'code' in value && 'message' in value) return value;
        const res: StdResponse = { code: '1', message: 'OK', data: value };
        return res;
      }),
    );
  }
}
