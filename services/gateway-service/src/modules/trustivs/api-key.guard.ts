import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const originalUrl: string = req.originalUrl || req.url || '';
    // Allow proxy endpoints without token
    if (originalUrl.startsWith('/trustivs/proxy/')) {
      return true;
    }
    // If upstream requires token header, ensure presence.
    const token = req.headers['token'] as string | undefined;
    const envToken = process.env.TRUSTIVS_TOKEN;
    if (!token && !envToken && process.env.REQUIRE_TRUSTIVS_TOKEN === '1') {
      throw new UnauthorizedException('token header required');
    }
    return true;
  }
}
