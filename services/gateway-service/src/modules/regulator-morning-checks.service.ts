export type RegulatedCheck = {
  id: string;
  schoolId?: string;
  schoolName?: string;
  payload: any;
  receivedAt: string;
};

export class RegulatorMorningChecksService {
  private store: { list: RegulatedCheck[] } = { list: [] };

  list(): RegulatedCheck[] {
    return this.store.list;
  }

  push(body: any): { success: true; id: string } {
    const id = `rg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rec: RegulatedCheck = {
      id,
      schoolId: body?.schoolId,
      schoolName: body?.schoolName,
      payload: body,
      receivedAt: new Date().toISOString(),
    };
    this.store.list.push(rec);
    return { success: true, id };
  }
}

