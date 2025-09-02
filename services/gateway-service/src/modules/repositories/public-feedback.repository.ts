import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class PublicFeedbackRepository {
  constructor(private readonly db: DbService) {}

  async insertFeedback(rec: {
    id: string; schoolId: string; type: string; content: string; user?: string; contact?: string;
    status: string; at: string; read?: boolean;
  }) {
    await this.db.query(
      `insert ignore into public_feedback(
        id, school_id, type, content, user, contact, status, at, is_read
      ) values (?,?,?,?,?,?,?,?,?)`,
      [rec.id, rec.schoolId, rec.type, rec.content, rec.user || null, rec.contact || null, rec.status, new Date(rec.at), rec.read ? 1 : 0]
    );
  }

  async reply(id: string, replyContent: string, replyBy: string, replyAtISO: string, processingMs?: number) {
    await this.db.query(
      `update public_feedback set status = '已回复', reply_by = ?, reply_at = ?, reply_content = ?, is_read = 1, processing_ms = ? where id = ?`,
      [replyBy, new Date(replyAtISO), replyContent, processingMs ?? null, id]
    );
  }

  async markRead(id: string, read: boolean) {
    await this.db.query('update public_feedback set is_read = ? where id = ?', [read ? 1 : 0, id]);
  }

  async list(params?: {
    schoolId?: string;
    type?: string;
    status?: string;
    start?: string;
    end?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: string[] = [];
    const values: any[] = [];
    if (params?.schoolId) { where.push('school_id = ?'); values.push(params.schoolId); }
    if (params?.type) { where.push('type = ?'); values.push(params.type); }
    if (params?.status) { where.push('status = ?'); values.push(params.status); }
    if (params?.start) { where.push('at >= ?'); values.push(new Date(params.start)); }
    if (params?.end) { where.push('at <= ?'); values.push(new Date(params.end)); }
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(1, Math.min(params?.pageSize || 20, 200));
    const base = `from public_feedback ${where.length ? 'where ' + where.join(' and ') : ''}`;
    const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, values);
    const total = Number(totalRows.rows[0]?.c || 0);
    const rows = await this.db.query<any>(
      `select id, school_id as schoolId, type, content, user, contact, status, at, reply_by as replyBy, reply_at as replyAt, reply_content as replyContent, is_read as read, processing_ms as processingMs ${base} order by at desc limit ? offset ?`,
      [...values, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.rows, total, page, pageSize };
  }
}
