import { Body, Controller, Get, Post, Patch, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EmergencyService, AlertType } from './emergency.service';

@Controller('school/emergency')
export class EmergencyController {
  constructor(private readonly svc: EmergencyService) {}

  @Get('overview') overview() {
    return this.svc.overview();
  }

  @Get('events') listEvents(@Query('type') type?: AlertType, @Query('status') status?: any) {
    return this.svc.listEvents({ type, status });
  }
  @Post('alerts/raise') raise(@Body() b: { type: AlertType; title: string; level?: any }) {
    return this.svc.raiseAlert({ type: b.type, title: b.title, level: b.level as any });
  }
  @Post('events/accept') accept(@Body() b: { id: string }) {
    return this.svc.accept(b.id);
  }
  @Post('events/clear') clear(@Body() b: { id: string }) {
    return this.svc.clear(b.id);
  }
  @Post('events/start-plan') startPlan(@Body() b: { id: string; planId: string }) {
    return this.svc.startPlan(b.id, b.planId);
  }

  @Get('plans') plans() {
    return this.svc.listPlans();
  }
  @Post('plans') createPlan(
    @Body() b: { title: string; flow: string; law?: string; actions?: string[] },
  ) {
    return this.svc.createPlan(b);
  }

  @Get('duty') duty() {
    return this.svc.listDuty();
  }
  @Post('duty') saveDuty(
    @Body() b: { id?: string; name: string; members: string[]; oncall: string },
  ) {
    return this.svc.saveDuty(b);
  }

  @Get('meetings') meetings() {
    return this.svc.listMeetings();
  }
  @Post('meetings') createMeeting(
    @Body() b: { scene: AlertType; title: string; micOn?: boolean; camOn?: boolean },
  ) {
    return this.svc.createMeeting(b);
  }
  @Patch('meetings/state') setMeetingState(
    @Query('id') id: string,
    @Body() b: { micOn?: boolean; camOn?: boolean; sharing?: boolean },
  ) {
    return this.svc.setMeetingState(id, b);
  }
  @Post('meetings/invite') invite(@Body() b: { id: string; who: string }) {
    return this.svc.inviteParticipant(b.id, b.who);
  }
  @Get('tasks') tasks(@Query('scene') scene?: AlertType) {
    return this.svc.listTasks({ scene });
  }
  @Post('tasks') createTask(@Body() b: { scene: AlertType; title: string; assignees: string[] }) {
    return this.svc.createTask(b);
  }
  @Patch('tasks/status') setTaskStatus(
    @Query('id') id: string,
    @Body() b: { status: '待办' | '进行中' | '已完成' },
  ) {
    return this.svc.setTaskStatus(id, b.status);
  }

  @Get('cameras') cameras() {
    return this.svc.listCameras();
  }
  @Get('resources') resources() {
    return this.svc.listResources();
  }

  @Post('notify') notify(
    @Body() b: { scene: AlertType; to: string; via: 'sms' | 'voice' | 'app'; content: string },
  ) {
    return this.svc.notify(b);
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }

  // CSV exports
  @Get('events/export.csv') exportEventsCsv(
    @Query('type') type?: AlertType,
    @Query('status') status?: any,
  ) {
    const items = this.svc.listEvents({ type, status });
    const headers = ['id', 'type', 'title', 'status', 'at', 'planId'];
    const rows = items.map((r: any) => [r.id, r.type, r.title, r.status, r.at, r.planId || '']);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
  @Get('plans/export.csv') exportPlansCsv() {
    const items = this.svc.listPlans();
    const headers = ['id', 'title', 'flow', 'law', 'actions'];
    const rows = items.map((p: any) => [
      p.id,
      p.title,
      p.flow || '',
      p.law || '',
      (p.actions || []).join('|'),
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
  @Get('duty/export.csv') exportDutyCsv() {
    const items = this.svc.listDuty();
    const headers = ['id', 'name', 'members', 'oncall'];
    const rows = items.map((g: any) => [g.id, g.name, (g.members || []).join('|'), g.oncall || '']);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
  @Get('tasks/export.csv') exportTasksCsv(@Query('scene') scene?: AlertType) {
    const items = this.svc.listTasks({ scene });
    const headers = ['id', 'scene', 'title', 'assignees', 'status', 'createdAt'];
    const rows = items.map((t: any) => [
      t.id,
      t.scene,
      t.title,
      (t.assignees || []).join('|'),
      t.status,
      t.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
}
