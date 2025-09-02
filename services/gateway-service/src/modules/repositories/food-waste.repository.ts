import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class FoodWasteRepository {
  constructor(private readonly db: DbService) {}

  async insertRecord(r: {
    id: string; schoolId: string; date: string; source: string; itemType: string; itemName: string; weightKg: number; amountYuan: number; reason?: string; meal?: string;
  }) {
    await this.db.query(
      `insert ignore into food_waste_records(
        id, school_id, date, source, item_type, item_name, weight_kg, amount_yuan, reason, meal
      ) values (?,?,?,?,?,?,?,?,?,?)`,
      [r.id, r.schoolId, new Date(r.date), r.source, r.itemType, r.itemName, r.weightKg, r.amountYuan, r.reason || null, r.meal || null]
    );
  }

  async insertReason(id: string, name: string, enabled = true) {
    await this.db.query('insert ignore into food_waste_reasons(id, name, enabled) values(?,?,?)', [id, name, enabled ? 1 : 0]);
  }
  async setReasonEnabled(id: string, enabled: boolean) {
    await this.db.query('update food_waste_reasons set enabled = ? where id = ?', [enabled ? 1 : 0, id]);
  }
  async deleteReason(id: string) {
    await this.db.query('delete from food_waste_reasons where id = ?', [id]);
  }
}

