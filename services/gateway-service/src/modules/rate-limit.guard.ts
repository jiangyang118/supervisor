import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';

// Very small in-memory, per-IP, per-minute rate limiter for ingestion endpoints.
// Configure max per minute via env INGEST_RPM (default 120).
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, { count: number; minute: number }>();
  private readonly limit: number;

  constructor() {
    const envLimit = parseInt(process.env.INGEST_RPM || '', 10);
    this.limit = Number.isFinite(envLimit) && envLimit > 0 ? envLimit : 120;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = this.getClientIp(req);
    const nowMinute = Math.floor(Date.now() / 60000);
    const entry = this.buckets.get(ip);
    if (!entry || entry.minute !== nowMinute) {
      this.buckets.set(ip, { count: 1, minute: nowMinute });
      return true;
    }
    entry.count += 1;
    if (entry.count > this.limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  private getClientIp(req: any): string {
    const xf = (req.headers['x-forwarded-for'] as string) || '';
    const ip = (xf.split(',')[0] || req.ip || req.connection?.remoteAddress || 'unknown').trim();
    return ip;
  }
}
