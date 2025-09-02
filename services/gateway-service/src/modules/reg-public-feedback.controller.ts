import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PublicFeedbackService, FeedbackStatus, FeedbackType } from './public-feedback.service';

@Controller('reg/public/feedback')
export class RegPublicFeedbackController {
  constructor(private readonly svc: PublicFeedbackService) {}

  private schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  private normalizeType(t?: string): FeedbackType | undefined {
    if (!t) return undefined;
    // 兼容“评价”与“评论”
    if (t === '评价') return '评论';
    return t as FeedbackType;
  }

  @Get('list')
  async list(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: FeedbackType | '评价',
    @Query('status') status?: FeedbackStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const res = await this.svc.list({
      schoolId,
      type: this.normalizeType(type),
      status,
      start,
      end,
      page,
      pageSize,
    });
    const items = (res.items as any[]).map((r: any) => ({
      ...r,
      school: this.schools().find((s) => s.id === r.schoolId)?.name || r.schoolId,
      type: r.type === '评论' ? '评价' : r.type,
    }));
    return { ...res, items };
  }

  @Get('export.csv')
  async exportCsv(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: FeedbackType | '评价',
    @Query('status') status?: FeedbackStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = await this.list(schoolId, type, status, start, end, '1', '100000');
    const headers = [
      'id',
      'schoolId',
      'school',
      'type',
      'content',
      'user',
      'contact',
      'status',
      'at',
      'replyBy',
      'replyAt',
      'read',
      'processingMs',
    ];
    const rows = (items as any[]).map((r) => [
      r.id,
      r.schoolId,
      r.school,
      r.type,
      r.content,
      r.user || '',
      r.contact || '',
      r.status,
      r.at,
      r.replyBy || '',
      r.replyAt || '',
      r.read ? '1' : '0',
      r.processingMs ?? '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('stats')
  async stats(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const s = await this.svc.stats({ schoolId, start, end });
    // 将“评论”映射为“评价”
    return {
      ...s,
      byType: (s.byType || []).map((x: any) => ({
        type: x.type === '评论' ? '评价' : x.type,
        count: x.count,
      })),
    };
  }

  // 可选：监管端也能回复
  @Post('reply')
  reply(@Body() b: { id: string; replyContent: string; replyBy?: string }) {
    return this.svc.reply(b.id, b.replyContent, b.replyBy || '监管单位');
  }
}
