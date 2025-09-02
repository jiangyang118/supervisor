import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type RegulatedCheckRow = {
  id: string;
  schoolId?: string;
  schoolName?: string;
  payload: any;
  receivedAt: string;
};

@Injectable()
export class RegulatorMorningChecksRepository {
  constructor(private readonly db: DbService) {}

  async list(limit = 1000): Promise<RegulatedCheckRow[]> {
    const { rows } = await this.db.query<RegulatedCheckRow>(
      'select id, school_id as schoolId, school_name as schoolName, payload, received_at as receivedAt from regulator_morning_checks order by received_at desc limit ?',[limit]
    );
    return rows;
  }

  async insert(rec: RegulatedCheckRow): Promise<void> {
    await this.db.query(
      'insert ignore into regulator_morning_checks(id, school_id, school_name, payload, received_at) values(?,?,?,?,?)',
      [rec.id, rec.schoolId || null, rec.schoolName || null, JSON.stringify(rec.payload), rec.receivedAt]
    );
  }
}

