import { Injectable, BadRequestException } from '@nestjs/common';
import { PublicFeedbackRepository } from './repositories/public-feedback.repository';

export type FeedbackType = '投诉' | '建议' | '表扬' | '评论';
export type FeedbackStatus = '待处理' | '已回复';

export type Feedback = {
  id: string;
  schoolId: string;
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
  private seq = 1;
  private id() {
    return `FB-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }

  private items: Feedback[] = [];

  list(params?: {
    schoolId?: string;
    type?: FeedbackType;
    status?: FeedbackStatus;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    let arr = this.items.slice();
    if (params?.schoolId) arr = arr.filter((x) => x.schoolId === params.schoolId);
    if (params?.type) arr = arr.filter((x) => x.type === params.type);
    if (params?.status) arr = arr.filter((x) => x.status === params.status);
    if (params?.start) arr = arr.filter((x) => Date.parse(x.at) >= Date.parse(params.start!));
    if (params?.end) arr = arr.filter((x) => Date.parse(x.at) <= Date.parse(params.end!));
    arr.sort((a, b) => (a.at < b.at ? 1 : -1));
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const items = arr.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  create(b: {
    schoolId?: string;
    type: FeedbackType;
    content: string;
    user?: string;
    contact?: string;
  }) {
    if (!b?.type || !b?.content) throw new BadRequestException('type/content required');
    const it: Feedback = {
      id: this.id(),
      schoolId: b.schoolId || 'sch-001',
      type: b.type,
      content: b.content,
      user: b.user,
      contact: b.contact,
      status: '待处理',
      at: this.now(),
      read: false,
    };
    this.items.unshift(it);
    this.repo?.insertFeedback(it).catch(() => void 0);
    return it;
  }

  reply(id: string, replyContent: string, replyBy?: string) {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx === -1) throw new BadRequestException('not found');
    const now = this.now();
    const started = Date.parse(this.items[idx].at);
    this.items[idx] = {
      ...this.items[idx],
      status: '已回复',
      replyBy: replyBy || '系统',
      replyAt: now,
      replyContent,
      read: true,
      processingMs: Number.isFinite(started) ? Date.parse(now) - started : undefined,
    };
    const rec = this.items[idx];
    this.repo?.reply(id, replyContent, rec.replyBy!, rec.replyAt!, rec.processingMs).catch(() => void 0);
    return rec;
  }

  markRead(id: string, read: boolean) {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx === -1) throw new BadRequestException('not found');
    this.items[idx].read = !!read;
    this.repo?.markRead(id, !!read).catch(() => void 0);
    return this.items[idx];
  }

  batchReply(ids: string[], replyContent: string, replyBy?: string) {
    let count = 0;
    for (const id of ids || []) {
      try {
        this.reply(id, replyContent, replyBy);
        count++;
      } catch {
        // ignore not found
      }
    }
    return { count };
  }

  stats(params?: { schoolId?: string; start?: string; end?: string }) {
    const { items } = this.list({ ...params, page: 1, pageSize: 100000 });
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

  constructor(private readonly repo?: PublicFeedbackRepository) {
    // seed
    this.create({
      type: '建议',
      content: '建议增加营养菜谱公示',
      user: '家长A',
      contact: '13800000000',
    });
    this.create({ type: '投诉', content: '窗口排队时间过长', user: '家长B' });
    const fb = this.create({ type: '表扬', content: '今日菜品很新鲜', user: '学生C' });
    this.reply(fb.id, '感谢您的反馈！我们会继续保持。', '食堂管理员');
  }
}
