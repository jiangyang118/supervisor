import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class DeviceSignGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 默认关闭，通过环境变量 ENABLE_DEVICE_SIGNATURE 开启
    if (!process.env.ENABLE_DEVICE_SIGNATURE) return true;
    const req: any = context.switchToHttp().getRequest();
    const key = process.env.DEVICE_SIGN_KEY || '';
    const query = { ...req.query, ...req.body } as Record<string, any>;
    const sign = query.sign || req.headers['x-sign'];
    if (!sign) return false;
    delete query.sign;
    const entries = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const raw = entries + key;
    const md5 = crypto.createHash('md5').update(raw).digest('hex').toLowerCase();
    return md5 === String(sign).toLowerCase();
  }
}
