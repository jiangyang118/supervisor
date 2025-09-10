import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth.types';
import { PERM_METADATA } from './perm.decorator';
import { RolesRepository } from './repositories/roles.repository';
import { SystemService } from './system.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesRepo: RolesRepository,
    @Optional() private readonly sys?: SystemService,
  ) {}

  private async computePermissions(roles: string[]): Promise<string[]> {
    try {
      const roleDefs = await this.rolesRepo.listRoles();
      const keys = new Set<string>();
      const owned = new Set<string>();
      roles.forEach((r) => keys.add(r));
      for (const r of roleDefs) if (keys.has(r.name)) (r.permissions || []).forEach((p) => owned.add(p));
      // Treat ADMIN/PLATFORM_SUPER as superuser even if DB lacks role_permissions
      if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) owned.add('*:*');
      return Array.from(owned);
    } catch {
      // fallback to in-memory roles if available; otherwise none
      const mem = this.sys ? (await this.sys.listRoles() as any[]) : [];
      let perms: string[] = [];
      for (const role of roles) {
        const found = mem.find((r) => r.name === role);
        if (found?.permissions) perms.push(...found.permissions);
      }
      if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) perms.push('*:*');
      return Array.from(new Set(perms));
    }
  }

  private match(required: string, owned: string[]): boolean {
    if (!required) return true;
    if (owned.includes('*') || owned.includes('*:*') || owned.includes(required)) return true;
    const [ns, act] = required.includes(':') ? required.split(':') : [required, ''];
    return owned.includes(`${ns}:*`) || owned.includes(`${ns}.*`) || (!!act && owned.includes(`${ns}:${act}`));
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = (req?.user || {}) as AuthUser;
    const required = this.reflector.getAllAndOverride<string[]>(PERM_METADATA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) || [];
    if (!required.length) return true;
    const owned = user.permissions && user.permissions.length ? user.permissions : await this.computePermissions(user.roles || []);
    const ok = required.some((p) => this.match(p, owned || []));
    if (!ok) throw new ForbiddenException('Insufficient permissions');
    // attach computed perms for downstream use
    (req.user as AuthUser).permissions = owned;
    return true;
  }
}
