import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type MorningCheckRow = {
  id: string;
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
    id: string;
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
  }) {
    const sql = `insert ignore into morning_checks
      (id, equipment_code, user_id, check_time, forehead_temp, normal_temperature_min, normal_temperature_max, abnormal_temp, hand_check_result, health_ask_result, health, images, raw)
      values (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [
      record.id,
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
    await this.db.query(sql, params);
  }

  async list(limit = 1000): Promise<MorningCheckRow[]> {
    const { rows } = await this.db.query<MorningCheckRow>(
      `select id,
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
}

