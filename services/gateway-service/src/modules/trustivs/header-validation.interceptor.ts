import { CallHandler, ExecutionContext, Injectable, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class HeaderValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const originalUrl: string = req.originalUrl || req.url || '';
    // Skip validation for proxy streaming endpoints
    if (originalUrl.startsWith('/trustivs/proxy/')) {
      return next.handle();
    }
    const time = req.headers['time'];
    const uuid = req.headers['uuid'];
    const skewMin = Number(process.env.TIME_SKEW_MINUTES || (process.env.NODE_ENV === 'production' ? 5 : 10));
    if (!time || !uuid) throw new BadRequestException('Missing required headers: time, uuid');
    const t = Number(time);
    if (!Number.isFinite(t)) throw new BadRequestException('Invalid header: time');
    const deltaMin = Math.abs(Date.now() - t) / 60000;
    if (deltaMin > skewMin) throw new BadRequestException('Time skew too large');
    return next.handle();
  }
}
