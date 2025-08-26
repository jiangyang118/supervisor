import { Controller, Get, Post, Body } from '@nestjs/common';
import { DataStore, AIEvent } from './data.store';

@Controller()
export class AIController {
  // 学校端查询本校事件
  @Get('school/ai/events')
  schoolEvents(): AIEvent[] {
    return DataStore.aiEvents;
  }

  @Post('school/ai/events/handle')
  handleSchool(@Body() dto: { eventId: string; measure: string }) {
    const ev = DataStore.aiEvents.find((e) => e.id === dto.eventId);
    if (ev) {
      ev.status = 'CLOSED';
      ev.measure = dto.measure;
    }
    return { ok: true };
  }

  // 监管端查询全量事件
  @Get('reg/ai/inspections')
  regEvents(): AIEvent[] {
    return DataStore.aiEvents;
  }

  // 监管端巡查任务列表（示例）
  @Get('reg/ai/tasks')
  regTasks() {
    return [
      {
        id: 'TASK-001',
        school: '示例一中',
        camera: '1# 后厨-操作台',
        action: '巡查抓拍',
        status: '待处理',
        dueAt: new Date(Date.now() + 3600e3).toISOString(),
      },
      {
        id: 'TASK-002',
        school: '示例二小',
        camera: '2# 后厨-操作台',
        action: '语音提醒',
        status: '进行中',
        dueAt: new Date(Date.now() + 7200e3).toISOString(),
      },
    ];
  }

  // 监管端远程喊话（示例）
  @Post('reg/ai/broadcast')
  broadcast(@Body() dto: { school: string; camera: string; text: string }) {
    return { ok: true, sentAt: new Date().toISOString(), ...dto };
  }
}
