import { Controller, Get, Query } from '@nestjs/common';
import { DataStore, Inbound, Outbound, Hygiene, Device } from './data.store';
type ParentFeedback = { parent: string; rating: number; comment: string };

@Controller('home')
export class HomeController {
  @Get('inbound')
  inbound(@Query('schoolId') schoolId?: string): Inbound[] {
    const sid = schoolId || 'sch-001';
    return DataStore.inbound.filter((r) => r.schoolId === sid);
  }

  @Get('outbound')
  outbound(@Query('schoolId') schoolId?: string): Outbound[] {
    const sid = schoolId || 'sch-001';
    return DataStore.outbound.filter((r) => r.schoolId === sid);
  }

  @Get('hygiene')
  hygiene(@Query('schoolId') schoolId?: string): Hygiene[] {
    const sid = schoolId || 'sch-001';
    return DataStore.hygiene.filter((r) => r.schoolId === sid);
  }

  @Get('devices')
  devices(@Query('schoolId') schoolId?: string): Device[] {
    const sid = schoolId || 'sch-001';
    return DataStore.devices.filter((r) => r.schoolId === sid);
  }

  @Get('parent-feedback')
  parentFeedback(): ParentFeedback[] {
    const names = ['家长A', '家长B', '家长C', '家长D', '家长E'];
    const comments = ['孩子说菜不错', '干净卫生', '希望提升口味'];
    return Array.from({ length: 5 }).map((_, i) => ({
      parent: names[i],
      rating: 4,
      comment: comments[(i + 1) % comments.length],
    }));
  }
}
