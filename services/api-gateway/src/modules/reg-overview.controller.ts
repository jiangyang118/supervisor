import { Controller, Get } from '@nestjs/common';

@Controller('reg')
export class RegOverviewController {
  @Get('overview')
  overview() {
    const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const schools = 42;
    const canteens = 58;
    const todayReports = rnd(60, 120);
    const aiWarnings = rnd(5, 25);
    const hygienePassRate = rnd(90, 99);
    const devicesOnlineRate = rnd(85, 98);
    const aiByType = [
      { type: '未戴帽', count: rnd(1, 12) },
      { type: '未戴口罩', count: rnd(0, 8) },
      { type: '打电话', count: rnd(0, 6) },
      { type: '吸烟', count: rnd(0, 3) },
    ];
    const dailyReports = Array.from({ length: 7 }).map((_, i) => ({
      day: `D-${6 - i}`,
      count: rnd(40, 100),
    }));
    const topWarnings = Array.from({ length: 5 }).map((_, i) => ({
      rank: i + 1,
      school: `示例学校${i + 1}`,
      warnings: rnd(1, 12),
    }));
    const expiringCerts = Array.from({ length: 5 }).map((_, i) => ({
      owner: `人员${i + 1}`,
      type: '健康证',
      expireAt: new Date(Date.now() + (i + 3) * 86400000).toISOString().slice(0, 10),
    }));
    return {
      kpis: { schools, canteens, todayReports, aiWarnings, hygienePassRate, devicesOnlineRate },
      aiByType,
      dailyReports,
      topWarnings,
      expiringCerts,
    };
  }

  @Get('schools')
  schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  @Get('schools/stats')
  schoolStats() {
    const base = this.schools();
    return base.map((s) => {
      const online = Math.floor(Math.random() * 4) + 2;
      const offline = Math.floor(Math.random() * 2);
      return { ...s, online, offline };
    });
  }

  @Get('schools/sch-001/cameras')
  cams1() {
    return this._cameras('示例一中');
  }
  @Get('schools/sch-002/cameras')
  cams2() {
    return this._cameras('示例二小');
  }
  @Get('schools/sch-003/cameras')
  cams3() {
    return this._cameras('示例三幼');
  }
  @Get('schools/sch-004/cameras')
  cams4() {
    return this._cameras('示例四小');
  }
  @Get('schools/sch-005/cameras')
  cams5() {
    return this._cameras('示例五中');
  }

  private _cameras(school: string) {
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const online = () => Math.random() < 0.85;
    const make = (id: string, name: string) => ({
      id,
      school,
      name,
      online: online(),
      snapshotUrl: null,
      flvUrl: `${base}/live/${encodeURIComponent(school)}-${id}.flv`,
      hlsUrl: `${base}/live/${encodeURIComponent(school)}-${id}.m3u8`,
    });
    return [
      make('ch-01', '后厨-操作台'),
      make('ch-02', '后厨-清洗区'),
      make('ch-03', '配菜间'),
      make('ch-04', '备餐间'),
      make('ch-05', '库房'),
      make('ch-06', '公示栏'),
      make('ch-07', '洗消间'),
      make('ch-08', '粗加工间'),
    ];
  }
}
