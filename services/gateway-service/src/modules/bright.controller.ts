import { Controller, Get, Param, Query, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { IotService } from './iot.service';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';

@Controller('bright')
export class BrightController {
  constructor(private readonly iot: IotService) {}
  private snaps: Array<{
    id: string;
    schoolId: string;
    cameraId: string;
    url: string;
    at: string;
  }> = [];
  private seq = 1;
  private id() {
    return `SN-${String(this.seq++).padStart(4, '0')}`;
  }
  private schoolList() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }
  private makeCameras() {
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const schools = this.schoolList();
    const mk = (sid: string) => {
      const arr = [
        { id: 'ch-01', name: '后厨-操作台' },
        { id: 'ch-02', name: '后厨-清洗区' },
        { id: 'ch-03', name: '配菜间' },
        { id: 'ch-04', name: '备餐间' },
      ];
      return arr.map((c) => ({
        schoolId: sid,
        school: schools.find((s) => s.id === sid)?.name || sid,
        id: c.id,
        name: c.name,
        online: Math.random() < 0.85,
        flvUrl: `${base}/live/${encodeURIComponent(sid)}-${c.id}.flv`,
        hlsUrl: `${base}/live/${encodeURIComponent(sid)}-${c.id}.m3u8`,
      }));
    };
    return schools.flatMap((s) => mk(s.id));
  }
  @Get('channels')
  channels() {
    return [
      { id: 'ch-01', name: '后厨-操作台', enabled: true },
      { id: 'ch-02', name: '后厨-清洗区', enabled: true },
      { id: 'ch-03', name: '配菜间', enabled: true },
      { id: 'ch-04', name: '备餐间', enabled: false },
    ];
  }

  @Get('start/:schoolId/:cameraId')
  start(@Param('schoolId') schoolId: string, @Param('cameraId') cameraId: string) {
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const key = encodeURIComponent(`${schoolId}-${cameraId}`);
    return {
      flvUrl: `${base}/live/${key}.flv`,
      hlsUrl: `${base}/live/${key}.m3u8`,
    };
  }

  // Regulator APIs
  @Get('reg/cameras')
  async regCameras(@Query('schoolId') schoolId?: string) {
    const sid = schoolId || '1';
    const cams = await this.iot.cameras({ company: undefined, schoolId: sid });
    return cams.map((c) => ({
      schoolId: sid,
      school: sid,
      id: c.id,
      name: c.name,
      online: !!c.online,
      flvUrl: c.flv || c.wsFlv,
      hlsUrl: c.hls,
    }));
  }

  // School APIs: same data, filtered by caller's school
  @Get('school/cameras')
  async schoolCameras(@Query('schoolId') schoolId?: string) {
    // Use TrustIVS-backed IoT cameras; map to previous schema expected by frontend
    const sid = schoolId || '1';
    const cams = await this.iot.cameras({ company: undefined, schoolId: sid });
    return cams.map((c) => ({
      schoolId: sid,
      school: sid,
      id: c.id,
      name: c.name,
      online: !!c.online,
      flvUrl: c.flv || c.wsFlv,
      hlsUrl: c.hls,
    }));
  }

  @Get('reg/playback')
  async playback(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers() headers?: Record<string, string>,
  ) {
    const list = await this.iot.back(cameraId, start || '', end || '', headers);
    // Map to legacy shape if needed
    return (Array.isArray(list) ? list : []).map((it: any) => {
      if (typeof it === 'string') return { start, end, hlsUrl: it };
      return {
        start: it.start || start,
        end: it.end || end,
        hlsUrl: it.hlsUrl || it.hls || it.url,
        flvUrl: it.flvUrl || it.flv,
      };
    });
  }

  @Get('school/playback')
  async schoolPlayback(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers() headers?: Record<string, string>,
  ) {
    return this.playback(cameraId, schoolId || '1', start, end, headers);
  }

  @Get('reg/snapshots')
  @UseGuards(JwtGuard, PermissionGuard)
  @Perm('stream:R')
  listSnaps(
    @Query('schoolId') schoolId?: string,
    @Query('cameraId') cameraId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    let arr = this.snaps.slice();
    if (schoolId) arr = arr.filter((s) => s.schoolId === schoolId);
    if (cameraId) arr = arr.filter((s) => s.cameraId === cameraId);
    if (start) arr = arr.filter((s) => s.at >= start);
    if (end) arr = arr.filter((s) => s.at <= end);
    return arr.sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  @Get('school/snapshots')
  schoolSnaps(
    @Query('schoolId') schoolId?: string,
    @Query('cameraId') cameraId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.listSnaps(schoolId || 'sch-001', cameraId, start, end);
  }

  @Post('reg/snapshots')
  @UseGuards(JwtGuard, PermissionGuard)
  @Perm('stream:C')
  createSnap(@Body() b: { schoolId: string; cameraId: string; at?: string; url?: string }) {
    const id = this.id();
    const at = b.at || new Date().toISOString();
    const url =
      b.url ||
      `https://picsum.photos/seed/${encodeURIComponent(b.schoolId + '-' + b.cameraId + '-' + id)}/240/160`;
    const rec = { id, schoolId: b.schoolId, cameraId: b.cameraId, at, url };
    this.snaps.unshift(rec);
    return rec;
  }

  @Post('school/snapshots')
  createSchoolSnap(@Body() b: { schoolId?: string; cameraId: string; at?: string; url?: string }) {
    return this.createSnap({ ...b, schoolId: b.schoolId || 'sch-001' } as any);
  }

  @Get('reg/download')
  async regDownload(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers() headers?: Record<string, string>,
  ) {
    const list = await this.iot.download(cameraId, start || '', end || '', headers);
    return (Array.isArray(list) ? list : []).map((it: any) => (typeof it === 'string' ? it : (it.url || it.hlsUrl || it.flvUrl))).filter(Boolean);
  }

  @Get('school/download')
  async schoolDownload(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers() headers?: Record<string, string>,
  ) {
    return this.regDownload(cameraId, schoolId || '1', start, end, headers);
  }

}
