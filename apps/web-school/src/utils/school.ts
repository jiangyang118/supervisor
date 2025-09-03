export type SchoolOption = { id: string; name: string };

const KEY = 0;

export function getCurrentSchoolId(): string {
  if (typeof localStorage === 'undefined') return 0;
  return localStorage.getItem(KEY) || 0;
}

export function setCurrentSchoolId(id: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, id);
}

export function toNumericSchoolId(id: string | number | undefined): number | undefined {
  if (typeof id === 'number') return id;
  if (!id) return undefined;
  const n = Number(String(id).replace(/\D/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

export function getCurrentSchoolIdNum(): number | undefined {
  return toNumericSchoolId(getCurrentSchoolId());
}


