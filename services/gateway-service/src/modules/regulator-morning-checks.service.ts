export type RegulatedCheck = {
  id: string;
  schoolId?: string;
  schoolName?: string;
  payload: any;
  receivedAt: string;
};

import { RegulatorMorningChecksRepository } from './repositories/regulator-morning-checks.repository';

export class RegulatorMorningChecksService {
  private store: { list: RegulatedCheck[] } = { list: [] };

  constructor(private readonly repo?: RegulatorMorningChecksRepository) {}

  async list(): Promise<RegulatedCheck[]> {
    if (this.repo) {
      try { return await this.repo.list(1000); } catch {}
    }
    return this.store.list;
  }

  async push(body: any): Promise<{ success: true; id: string }> {
    const id = `rg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rec: RegulatedCheck = {
      id,
      schoolId: body?.schoolId,
      schoolName: body?.schoolName,
      payload: body,
      receivedAt: new Date().toISOString(),
    };
    if (this.repo) {
      try { await this.repo.insert(rec); } catch { this.store.list.push(rec); }
    } else { this.store.list.push(rec); }
    return { success: true, id };
  }
}
