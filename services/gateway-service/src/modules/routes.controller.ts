import { Controller, Get } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Controller('health')
export class RoutesController {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  @Get('routes')
  list() {
    try {
      const app: any = this.adapterHost.httpAdapter.getInstance?.();
      const stack: any[] = app?._router?.stack || [];
      const routes: Array<{ method: string; path: string }> = [];
      const push = (method: string, path: string) => {
        routes.push({ method: method.toUpperCase(), path });
      };
      for (const layer of stack) {
        if (layer?.route && layer.route?.path) {
          const path = layer.route.path as string;
          const methods = Object.keys(layer.route.methods || {});
          for (const m of methods) if ((layer.route.methods as any)[m]) push(m, path);
        }
      }
      const uniq = new Map<string, { method: string; path: string }>();
      for (const r of routes) uniq.set(`${r.method} ${r.path}`, r);
      return { ok: true, count: uniq.size, routes: Array.from(uniq.values()).sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path))) };
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) } as any;
    }
  }
}

