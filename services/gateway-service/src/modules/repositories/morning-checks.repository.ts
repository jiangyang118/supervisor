import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type MorningCheckRow = {
  id: number;
  schoolId?: number | null;
  equipmentCode: string;
  userId: string;
  checkTime: string;
  foreheadTemp: number;
  normalTemperatureMin: number;
  normalTemperatureMax: number;
  abnormalTemp: number;
  handCheckResult: any;
  healthAskResult: any;
  health: number;
  images: any;
  raw: any;
};

@Injectable()
export class MorningChecksRepository {
  constructor(private readonly db: DbService) {}

  async insert(record: {
    schoolId?: number;
    equipmentCode: string;
    userId: string;
    checkTime: Date;
    foreheadTemp: number;
    normalTemperatureMin: number;
    normalTemperatureMax: number;
    abnormalTemp: number;
    handCheckResult: any[];
    healthAskResult: any[];
    health: number;
    images: any;
    raw: any;
  }): Promise<number> {
    const sql = `insert into morning_checks
      (school_id, equipment_code, user_id, check_time, forehead_temp, normal_temperature_min, normal_temperature_max, abnormal_temp, hand_check_result, health_ask_result, health, images, raw)
      values (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [
      record.schoolId ?? null,
      record.equipmentCode,
      record.userId,
      record.checkTime,
      record.foreheadTemp,
      record.normalTemperatureMin,
      record.normalTemperatureMax,
      record.abnormalTemp,
      JSON.stringify(record.handCheckResult || []),
      JSON.stringify(record.healthAskResult || []),
      record.health,
      JSON.stringify(record.images || {}),
      JSON.stringify(record.raw || {}),
    ];
    const res = await this.db.query(sql, params);
    return res.insertId || 0;
  }

  async list(limit = 1000): Promise<MorningCheckRow[]> {
    const { rows } = await this.db.query<MorningCheckRow>(
      `select id,
              school_id as schoolId,
              equipment_code as equipmentCode,
              user_id as userId,
              check_time as checkTime,
              forehead_temp as foreheadTemp,
              normal_temperature_min as normalTemperatureMin,
              normal_temperature_max as normalTemperatureMax,
              abnormal_temp as abnormalTemp,
              coalesce(hand_check_result, JSON_ARRAY()) as handCheckResult,
              coalesce(health_ask_result, JSON_ARRAY()) as healthAskResult,
              health as health,
              images,
              raw
       from morning_checks
       order by check_time desc
       limit ?`,
      [limit],
    );
    return rows;
  }

  async search(params: {
    schoolId?: number;
    userId?: string;
    equipmentCode?: string;
    abnormal?: boolean;
    start?: string; // ISO or RFC date string
    end?: string;   // ISO or RFC date string
    q?: string;     // fuzzy match on userId/equipmentCode
    page: number;
    pageSize: number;
  }): Promise<{ items: MorningCheckRow[]; total: number; page: number; pageSize: number }>{
    const where: string[] = [];
    const args: any[] = [];
    if (params.schoolId !== undefined && params.schoolId !== null) { where.push('school_id = ?'); args.push(params.schoolId); }
    if (params.userId) { where.push('user_id = ?'); args.push(params.userId); }
    if (params.equipmentCode) { where.push('equipment_code = ?'); args.push(params.equipmentCode); }
    if (typeof params.abnormal === 'boolean') { where.push('abnormal_temp = ?'); args.push(params.abnormal ? 1 : 0); }
    if (params.start) { where.push('check_time >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('check_time <= ?'); args.push(new Date(params.end)); }
    if (params.q) {
      where.push('(user_id like ? or equipment_code like ?)');
      const v = `%${params.q}%`;
      args.push(v, v);
    }
    const whereSql = where.length ? `where ${where.join(' and ')}` : '';
    const { rows: cntRows } = await this.db.query<any>(`select count(1) as c from morning_checks ${whereSql}`, args);
    const total = Number(cntRows?.[0]?.c || 0);
    const limit = Math.max(1, params.pageSize || 20);
    const offset = Math.max(0, (Math.max(1, params.page || 1) - 1) * limit);
    const { rows } = await this.db.query<MorningCheckRow>(
      `select id,
              school_id as schoolId,
              equipment_code as equipmentCode,
              user_id as userId,
              check_time as checkTime,
              forehead_temp as foreheadTemp,
              normal_temperature_min as normalTemperatureMin,
              normal_temperature_max as normalTemperatureMax,
              abnormal_temp as abnormalTemp,
              coalesce(hand_check_result, JSON_ARRAY()) as handCheckResult,
              coalesce(health_ask_result, JSON_ARRAY()) as healthAskResult,
              health as health,
              images,
              raw
       from morning_checks
       ${whereSql}
       order by check_time desc
       limit ? offset ?`,
      [...args, limit, offset],
    );
    return { items: rows, total, page: Math.max(1, params.page || 1), pageSize: limit };
  }

  async getById(id: number): Promise<MorningCheckRow | null> {
    // id is numeric; accept string input but cast by caller when possible
    const { rows } = await this.db.query<MorningCheckRow>(
      `select id,
              school_id as schoolId,
              equipment_code as equipmentCode,
              user_id as userId,
              check_time as checkTime,
              forehead_temp as foreheadTemp,
              normal_temperature_min as normalTemperatureMin,
              normal_temperature_max as normalTemperatureMax,
              abnormal_temp as abnormalTemp,
              coalesce(hand_check_result, JSON_ARRAY()) as handCheckResult,
              coalesce(health_ask_result, JSON_ARRAY()) as healthAskResult,
              health as health,
              images,
              raw
       from morning_checks where id = ? limit 1`,
      [id],
    );
    return rows[0] || null;
  }

  async remove(id: number) {
    await this.db.query('delete from morning_checks where id = ?', [id]);
  }

  async setMeasure(id: number, measure?: string) {
    // Persist measure into raw JSON under $.measure
    await this.db.query(
      `update morning_checks
       set raw = JSON_SET(COALESCE(raw, JSON_OBJECT()), '$.measure', ?)
       where id = ?`,
      [measure || null, id],
    );
  }
}
