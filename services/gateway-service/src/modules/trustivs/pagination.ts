export type Paged<T> = { pageNum: number; pageSize: number; total: number; pages: number; list: T[] };

export function normalizePage(q: any): { pageNum: number; pageSize: number } {
  const pnRaw = q?.pageNum ?? q?.page ?? '1';
  const psRaw = q?.pageSize ?? '20';
  const pageNum = Math.max(parseInt(String(pnRaw), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(psRaw), 10) || 20, 1), 200);
  return { pageNum, pageSize };
}

