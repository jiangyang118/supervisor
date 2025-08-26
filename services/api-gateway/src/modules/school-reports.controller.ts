import { Controller, Get, Query } from '@nestjs/common';
import { DataStore } from './data.store';

@Controller('reports')
export class SchoolReportsController {
  @Get('school/daily')
  daily(@Query('schoolId') schoolId?: string) {
    const sid = schoolId || 'sch-001';
    const inbound = DataStore.inbound.filter((r) => r.schoolId === sid);
    const outbound = DataStore.outbound.filter((r) => r.schoolId === sid);
    const hygiene = DataStore.hygiene.filter((r) => r.schoolId === sid);
    const devices = DataStore.devices.filter((r) => r.schoolId === sid);
    const aiEvents = DataStore.aiEvents.filter((r) => r.schoolId === sid);
    const morning = DataStore.morning.filter((r) => r.schoolId === sid);
    const sampling = DataStore.sampling.filter((r) => r.schoolId === sid);
    const disinfection = DataStore.disinfection.filter((r) => r.schoolId === sid);
    const dine = DataStore.dine.filter((r) => r.schoolId === sid);
    const waste = DataStore.waste.filter((r) => r.schoolId === sid);

    const aiMap: Record<string, number> = {};
    for (const e of aiEvents) aiMap[e.type] = (aiMap[e.type] || 0) + 1;
    const aiByType = Object.entries(aiMap).map(([type, count]) => ({ type, count }));

    const inboundQty = inbound.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const outboundQty = outbound.reduce((s, o) => s + (Number(o.qty) || 0), 0);

    // KPI：统一从数据源统计（后续可替换为数据库查询）
    const kpi = {
      morning: morning.length,
      sampling: sampling.length,
      disinfection: disinfection.length,
      dine: dine.length,
      waste: waste.length,
      ai: aiEvents.length,
      inboundCount: inbound.length,
      outboundCount: outbound.length,
      inboundQty,
      outboundQty,
      // 辅助指标
      hygienePassRate: hygiene.length
        ? Math.round((hygiene.filter((h) => h.result === '合格').length / hygiene.length) * 100)
        : 100,
      deviceOnlineRate: devices.length
        ? Math.round((devices.filter((d) => d.status === '在线').length / devices.length) * 100)
        : 100,
    };

    return { kpi, aiByType, inbound, outbound, hygiene, devices };
  }
}
