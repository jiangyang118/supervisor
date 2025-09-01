import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PublicFeedbackService, FeedbackType, FeedbackStatus } from './public-feedback.service';

@Controller('school/public/feedback')
export class PublicFeedbackController {
  constructor(private readonly svc: PublicFeedbackService) {}

  @Get('list')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: FeedbackType,
    @Query('status') status?: FeedbackStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, type, status, start, end, page, pageSize });
  }

  @Post('create')
  create(
    @Body()
    b: {
      schoolId?: string;
      type: FeedbackType;
      content: string;
      user?: string;
      contact?: string;
    },
  ) {
    return this.svc.create(b);
  }

  @Post('reply')
  reply(@Body() b: { id: string; replyContent: string; replyBy?: string }) {
    return this.svc.reply(b.id, b.replyContent, b.replyBy);
  }

  @Post('reply/batch')
  batchReply(@Body() b: { ids: string[]; replyContent: string; replyBy?: string }) {
    return this.svc.batchReply(b.ids, b.replyContent, b.replyBy);
  }

  @Post('read')
  markRead(@Body() b: { id: string; read: boolean }) {
    return this.svc.markRead(b.id, b.read);
  }

  @Get('stats')
  stats(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.svc.stats({ schoolId, start, end });
  }

  @Get('export.csv')
  exportCsv(
    @Query('type') type?: any,
    @Query('status') status?: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const { items } = this.svc.list({
      type,
      status,
      start,
      end,
      schoolId,
      page: 1,
      pageSize: 100000,
    });
    const headers = [
      'id',
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
    const rows = items.map((r: any) => [
      r.id,
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
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
}
