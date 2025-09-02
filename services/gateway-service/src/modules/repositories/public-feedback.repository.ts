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
}

