import { Injectable, BadRequestException } from '@nestjs/common';
import { PublicFeedbackRepository } from './repositories/public-feedback.repository';

export type FeedbackType = '投诉' | '建议' | '表扬' | '评论';
export type FeedbackStatus = '待处理' | '已回复';

export type Feedback = {
  id: number;
  schoolId: number | string;
  type: FeedbackType;
  content: string;
  user?: string;
  contact?: string;
  status: FeedbackStatus;
  at: string;
  replyBy?: string;
  replyAt?: string;
  replyContent?: string;
  read?: boolean;
  processingMs?: number;
};

@Injectable()
export class PublicFeedbackService {
  private now() {
    return new Date().toISOString();
  }

  async list(params?: {
    schoolId?: string;
    type?: FeedbackType;
    status?: FeedbackStatus;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    return this.repo!.list({
      schoolId: params?.schoolId,
      type: params?.type,
      status: params?.status,
      start: params?.start,
      end: params?.end,
      page,
      pageSize,
    });
  }

  async create(b: {
    schoolId?: string | number;
    type: FeedbackType;
    content: string;
    user?: string;
    contact?: string;
  }) {
    if (!b?.type || !b?.content) throw new BadRequestException('type/content required');
    const sid = Number(b.schoolId ?? 1) || 1;
    const rec = {
      schoolId: sid,
      type: b.type,
      content: b.content,
      user: b.user,
      contact: b.contact,
      status: '待处理' as FeedbackStatus,
      at: this.now(),
      read: false,
    };
    const insertId = await this.repo!.insertFeedback(rec as any);
    return { id: insertId, ...rec } as any;
  }

  async reply(id: string, replyContent: string, replyBy?: string) {
    const now = this.now();
    const replyByName = replyBy || '系统';
    await this.repo!.reply(id, replyContent, replyByName, now);
    return { ok: true } as any;
  }

  async markRead(id: string, read: boolean) {
    await this.repo!.markRead(id, !!read);
    return { ok: true } as any;
  }

  async batchReply(ids: string[], replyContent: string, replyBy?: string) {
    let count = 0;
    for (const id of ids || []) {
      try {
        await this.reply(id, replyContent, replyBy);
        count++;
      } catch {
        // ignore not found
      }
    }
    return { count };
  }

  async stats(params?: { schoolId?: string; start?: string; end?: string }) {
    const { items } = await this.list({ ...params, page: 1, pageSize: 100000 });
    const byType = new Map<FeedbackType, number>();
    const byStatus = new Map<FeedbackStatus, number>();
    let totalTime = 0;
    let timeCount = 0;
    for (const it of items) {
      byType.set(it.type, (byType.get(it.type) || 0) + 1);
      byStatus.set(it.status, (byStatus.get(it.status) || 0) + 1);
      if (typeof it.processingMs === 'number') {
        totalTime += it.processingMs;
        timeCount++;
      }
    }
    const avgProcessingMs = timeCount ? Math.round(totalTime / timeCount) : 0;
    return {
      byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      avgProcessingMs,
    };
  }

  constructor(private readonly repo?: PublicFeedbackRepository) {}
}
