export type SchoolOption = { id: string; name: string };

const KEY = 'current_school_id';

export function getCurrentSchoolId(): string {
  if (typeof localStorage === 'undefined') return 'sch-001';
  return localStorage.getItem(KEY) || 'sch-001';
}

export function setCurrentSchoolId(id: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, id);
}

export function getSchoolOptions(): SchoolOption[] {
  return [
    { id: 'sch-001', name: '示例一中' },
    { id: 'sch-002', name: '示例二小' },
  ];
}
