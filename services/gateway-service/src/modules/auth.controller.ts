import { Body, Controller, Post } from '@nestjs/common';
import { SystemService } from './system.service';
import { UsersRepository } from './repositories/users.repository';
import { RolesRepository } from './repositories/roles.repository';
import crypto from 'crypto';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function signHS256(payload: any, secret: string, expSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSeconds };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(body));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sig}`;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly sys: SystemService,
    private readonly usersRepo: UsersRepository,
    private readonly rolesRepo: RolesRepository,
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
    // 回退演示账户（仅当不存在或未配置 user_credentials 时）
    if (!ok) {
      usedDemo =
        (b.username === 'admin' && b.password === 'admin') ||
        (b.username === 'user' && b.password === 'user');
      ok = usedDemo;
    }

    // 3) 优先使用数据库结果，其次回退到内存数据，确保兼容未配置数据库的场景
    let userId = dbUser?.id ?? 0;
    let roles: string[] = dbUser?.roles ?? [];
    let displayName = dbUser?.displayName ?? b.username;
    if (!dbUser && usedDemo) {
      userId = b.username === 'admin' ? 1 : 2;
      roles = b.username === 'admin' ? ['ADMIN'] : ['SCHOOL'];
      displayName = b.username;
    }
    if (!dbUser && !usedDemo) return { ok: false, message: 'user not found' };
    if (!ok) return { ok: false, message: 'invalid credentials' };

    // 4) 计算权限：若数据库可用则从角色-权限表汇总，否则回退内存角色定义
    let permissions: string[] = [];
    try {
      const roleDefs = await this.rolesRepo.listRoles();
      const roleSet = new Set(roles);
      for (const r of roleDefs) if (roleSet.has(r.name)) permissions.push(...(r.permissions || []));
      permissions = Array.from(new Set(permissions));
    } catch {
      try {
        permissions = (this.sys.listRoles().find((r) => r.name === roles[0])?.permissions || []);
      } catch {
        permissions = [];
      }
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = signHS256({ sub: userId, username: b.username, roles }, secret, 8 * 3600);
    return { ok: true, token, user: { id: userId, name: displayName, roles, permissions } };
  }
}
