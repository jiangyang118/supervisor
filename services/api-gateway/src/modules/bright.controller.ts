import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';

@Controller('bright')
export class BrightController {
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
  regCameras(@Query('schoolId') schoolId?: string) {
    let cams = this.makeCameras();
    if (schoolId) cams = cams.filter((c) => c.schoolId === schoolId);
    return cams;
  }

  // School APIs: same data, filtered by caller's school
  @Get('school/cameras')
  schoolCameras(@Query('schoolId') schoolId?: string) {
    const sid = schoolId || 'sch-001';
    return this.makeCameras().filter((c) => c.schoolId === sid);
  }

  @Get('reg/playback')
  playback(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    // Demo: split the requested window into 2 segments with the same URLs
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const key = encodeURIComponent(`${schoolId}-${cameraId}`);
    const hlsUrl = `${base}/record/${key}.m3u8`;
    const flvUrl = `${base}/record/${key}.flv`;
    const now = Date.now();
    const s1 = start ? new Date(start).toISOString() : new Date(now - 3600e3).toISOString();
    const e1 = end ? new Date(end).toISOString() : new Date(now - 1800e3).toISOString();
    const s2 = e1;
    const e2 = new Date(now).toISOString();
    return [
      { start: s1, end: e1, hlsUrl, flvUrl },
      { start: s2, end: e2, hlsUrl, flvUrl },
    ];
  }

  @Get('school/playback')
  schoolPlayback(
    @Query('cameraId') cameraId: string,
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.playback(cameraId, schoolId || 'sch-001', start, end);
  }

  @Get('reg/snapshots')
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
}
