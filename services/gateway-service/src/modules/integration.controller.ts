import { Body, Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { abnormalTempFlag, computeHealth, discoverCandidates, fetchEmployees, parseRange } from './integration.utils';
import { getDevices, getEmployees, listChecks, saveMorningCheck, setEmployees, upsertDevice, pushRegulator, listRegulator } from './integration.store';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

@Controller()
export class IntegrationController {
  @Get('api/employees')
  listEmployees() { return { data: getEmployees() }; }

  @Post('api/employees/refresh')
  async refreshEmployees(@Body() body: any) {
    const envUrls = String(process.env.MEGO_BASE_URLS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const equipmentCode = String(process.env.EQUIPMENT_CODE || body?.equipmentCode || '');
    const fromDevice = getDevices().find((d) => d.equipmentCode === equipmentCode && d.baseUrl);
    const tryUrls = [fromDevice?.baseUrl, ...envUrls].filter(Boolean) as string[];
    if (!tryUrls.length || !equipmentCode)
      return { success: false, error: 'No candidate BASE_URL found or equipmentCode missing' };
    for (const baseUrl of tryUrls) {
      try {
        const list = await fetchEmployees(baseUrl, equipmentCode);
        setEmployees(list);
        return { success: true, count: list.length, baseUrl };
      } catch {}
    }
    return { success: false, message: 'All upstream fetch attempts failed' };
  }

  @Get('api/devices')
  listDevices() { return { data: getDevices() }; }

  @Post('api/devices/discover')
  async discover(@Body() body: any) {
    const parsed = z.object({ equipmentCode: z.string().min(1), candidates: z.array(z.string().url()).min(1) }).safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten() };
    const { equipmentCode, candidates } = parsed.data;
    const results = await discoverCandidates(candidates, equipmentCode);
    const ok = results.filter((r) => r.ok);
    if (ok.length) {
      const chosen = ok[0].baseUrl;
      upsertDevice({ equipmentCode, baseUrl: chosen, onlineStatus: 'online', lastHeartbeatAt: new Date().toISOString() });
    }
    return { results, autoSelected: ok[0]?.baseUrl || null };
  }

  private persistUpload(recordId: string, field: string, buffer: Buffer, ext = 'jpg'): string {
    const dir = path.join(process.cwd(), 'data', 'uploads', recordId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${field}.${ext}`);
    writeFileSync(filePath, buffer);
    return filePath;
  }

  @Post('api/integrations/morning-checks/mego')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'faceFile', maxCount: 1 },
    { name: 'palmFile', maxCount: 1 },
    { name: 'backOfHandFile', maxCount: 1 },
  ]))
  async megoIngest(@Body() body: any, @UploadedFiles() files?: { faceFile?: Express.Multer.File[]; palmFile?: Express.Multer.File[]; backOfHandFile?: Express.Multer.File[] }) {
    try {
      const pick = (name: string) => body?.[name] ?? body?.[name as keyof typeof body];
      const equipmentCode: string = pick('equipmentCode') || pick('machineCode');
      if (!equipmentCode) return { success: false, message: 'equipmentCode missing' };
      const uuid: string | undefined = pick('uuid');
      const userId: string = String(pick('userId'));
      const checkTime: string = String(pick('checkTime'));
      const foreheadTemp = Number(pick('foreheadTemp'));
      const rangeStr: string = String(pick('normalTemperatureRange') || '35.9-37.3');
      const [min, max] = parseRange(rangeStr);
      const abnormal: 0 | 1 = (Number(pick('abnormalTemp')) as any) ?? abnormalTempFlag(foreheadTemp, [min, max]);
      const handCsv = String(pick('handCheckResult') || '');
      const askCsv = String(pick('healthAskResult') || '');
      const health: 0 | 1 = (Number(pick('health')) as any) ?? computeHealth(abnormal, handCsv, askCsv);

      const id = `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const mc: any = {
        id,
        equipmentCode,
        userId: String(userId),
        checkTime,
        foreheadTemp,
        normalTemperatureMin: min,
        normalTemperatureMax: max,
        abnormalTemp: abnormal,
        handCheckResult: handCsv ? handCsv.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        healthAskResult: askCsv ? askCsv.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        health,
        images: {},
        raw: body,
      };

      if (files) {
        const f = (files.faceFile?.[0]); if (f) mc.images.face = this.persistUpload(id, 'face', f.buffer, 'jpg');
        const p = (files.palmFile?.[0]); if (p) mc.images.palm = this.persistUpload(id, 'palm', p.buffer, 'jpg');
        const b = (files.backOfHandFile?.[0]); if (b) mc.images.backOfHand = this.persistUpload(id, 'backOfHand', b.buffer, 'jpg');
      }

      const { id: recordId } = saveMorningCheck(mc, uuid);
      return { success: true, id: recordId };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Invalid payload' };
    }
  }

  @Get('api/morning-checks')
  listMorningChecks() { return { data: listChecks() }; }

  @Post('api/regulator/morning-checks/push')
  pushReg(@Body() body: any) {
    const id = `rg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    pushRegulator({ id, payload: body, receivedAt: new Date().toISOString() });
    return { success: true, id };
  }

  @Get('api/regulator/morning-checks')
  listReg() { return { data: listRegulator() }; }
}

