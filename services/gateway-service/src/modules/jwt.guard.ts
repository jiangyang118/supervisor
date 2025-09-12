import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_METADATA } from './public.decorator';
import { verifyHS256 } from './jwt.util';
import type { AuthUser } from './auth.types';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(@Optional() private readonly blacklist?: TokenBlacklistService, @Optional() private readonly reflector?: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      if (this.reflector) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_METADATA, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (isPublic) return true;
      }
    } catch {}
    const auth = (req.headers?.authorization || req.headers?.Authorization || '') as string;
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : '').trim();
    if (!token) throw new UnauthorizedException('Missing token');
    if (this.blacklist && this.blacklist.has(token)) throw new UnauthorizedException('Token revoked');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = verifyHS256(token, secret);
    if (!payload) throw new UnauthorizedException('Invalid token');
    (req as any).user = payload as AuthUser;
    return true;
  }
}
