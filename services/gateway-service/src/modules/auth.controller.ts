import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SystemService } from './system.service';
import { UsersRepository } from './repositories/users.repository';
import { RolesRepository } from './repositories/roles.repository';
import crypto from 'crypto';
import { verifyHS256, signHS256 } from './jwt.util';
import type { Request } from 'express';
import { TokenBlacklistService } from './token-blacklist.service';
import { SchoolUsersRepository } from './repositories/school-users.repository';

// sign moved to jwt.util; keep API unchanged

@Controller('auth')
export class AuthController {
  constructor(
    private readonly sys: SystemService,
    private readonly usersRepo: UsersRepository,
    private readonly rolesRepo: RolesRepository,
    private readonly blacklist: TokenBlacklistService,
    private readonly schoolUsers: SchoolUsersRepository,
  ) {}

  @Post('login')
  async login(@Body() b: { username: string; password: string }) {
    // 1) 从数据库读取用户与角色
    const dbUser = await this.usersRepo.findWithRolesByUsername(b.username);

    // 2) 校验密码：优先使用数据库 user_credentials（salt+sha256），否则回退到演示口令
    let ok = false;
    let usedDemo = false;
    try {
      const cred = await this.usersRepo.getCredentialByUsername(b.username);
      if (cred) {
        const computed = crypto
          .createHash('sha256')
          .update(cred.salt + (b.password || ''))
          .digest('hex')
          .toUpperCase();
        ok = computed === cred.passwordHash;
      }
    } catch {
      ok = false;
    }
    // 回退演示/默认账户（仅当不存在或未配置 user_credentials 时）
    if (!ok) {
      usedDemo =
        (b.username === 'super' && b.password === (process.env.SUPER_DEFAULT_PASSWORD || 'super123')) ||
        (b.username === 'admin' && b.password === (process.env.ADMIN_DEFAULT_PASSWORD || 'admin123')) ||
        (b.username === 'jiaowu' && b.password === (process.env.JIAOWU_DEFAULT_PASSWORD || 'jiaowu123'));
      ok = usedDemo;
    }

    // 3) 优先使用数据库结果，其次回退到内存数据，确保兼容未配置数据库的场景
    let userId = dbUser?.id ?? 0;
    let roles: string[] = dbUser?.roles ?? [];
    let displayName = dbUser?.displayName ?? b.username;
    if (!dbUser && usedDemo) {
      userId = b.username === 'super' ? 1 : b.username === 'admin' ? 2 : 3;
      roles = b.username === 'super' ? ['PLATFORM_SUPER'] : ['ADMIN'];
      displayName = b.username === 'super' ? '平台超管' : (b.username === 'admin' ? '监管超管' : '教务');
    }
    if (!dbUser && !usedDemo) return { ok: false, message: 'user not found' };
    if (!ok) return { ok: false, message: 'invalid credentials' };

    // 4) 计算权限：若数据库可用则从角色-权限表汇总，否则回退内存角色定义
    let permissions: string[] = [];
    try {
      const roleDefs = await this.rolesRepo.listRoles();
      const roleSet = new Set(roles);
      for (const r of roleDefs) if (roleSet.has(r.name)) permissions.push(...(r.permissions || []));
      // Grant super when role is ADMIN/PLATFORM_SUPER to avoid empty perms blocking UI
      if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) permissions.push('*');
      permissions = Array.from(new Set(permissions));
    } catch {
      try {
        permissions = (this.sys.listRoles().find((r) => r.name === roles[0])?.permissions || []);
        if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) permissions.push('*');
      } catch {
        permissions = [];
      }
    }

    const schools = await this.schoolUsers.listSchools(userId);
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = signHS256({ sub: userId, username: b.username, roles, schools }, secret, 8 * 3600);
    return { ok: true, token, user: { id: userId, name: displayName, roles, permissions, schools } };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const auth = (req.headers['authorization'] || req.headers['Authorization'] || '') as string;
    const token = (auth && auth.startsWith('Bearer ')) ? auth.slice(7) : '';
    if (!token) return { ok: false } as any;
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = verifyHS256(token, secret) as any;
    if (!payload) return { ok: false } as any;
    const roles = payload.roles || [];
    let permissions: string[] = [];
    try {
      const roleDefs = await this.rolesRepo.listRoles();
      const roleSet = new Set(roles);
      for (const r of roleDefs) if (roleSet.has(r.name)) permissions.push(...(r.permissions || []));
      // Superuser shortcut when DB role_permissions not initialized
      if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) permissions.push('*:*');
      permissions = Array.from(new Set(permissions));
    } catch {
      try {
        const mem = this.sys.listRoles() as any[];
        for (const role of roles) {
          const found = mem.find((r) => r.name === role);
          if (found?.permissions) permissions.push(...found.permissions);
        }
        if (roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER')) permissions.push('*:*');
        permissions = Array.from(new Set(permissions));
      } catch {
        permissions = roles.includes('ADMIN') || roles.includes('PLATFORM_SUPER') ? ['*:*'] : [];
      }
    }
    return { ok: true, user: { id: payload.sub, name: payload.username, roles, permissions } };
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    // 无状态 JWT：将当前 token 加入黑名单直到到期
    const auth = (req.headers['authorization'] || req.headers['Authorization'] || '') as string;
    const token = (auth && auth.startsWith('Bearer ')) ? auth.slice(7) : '';
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload: any = verifyHS256(token, secret);
        const exp = payload?.exp as number | undefined;
        this.blacklist.add(token, exp);
      } catch {
        // ignore invalid token
      }
    }
    return { ok: true } as any;
  }
}
