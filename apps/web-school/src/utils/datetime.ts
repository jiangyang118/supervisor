export function dateOnly(v?: string | Date | number | null): string {
  try {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '';
      // If looks like ISO with date part, take first 10
      if (s.length >= 10 && /\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const d = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
      if (!Number.isNaN(d.getTime())) return fmtDate(d);
      return s.length >= 10 ? s.slice(0, 10) : s;
    }
    if (typeof v === 'number') {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '' : fmtDate(d);
    }
    return fmtDate(v as Date);
  } catch { return String(v ?? '') || ''; }
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

