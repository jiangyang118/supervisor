export function exportCsv(filename: string, rows: Array<Record<string, any>>, headerMap?: Record<string, string>) {
  if (!rows || rows.length === 0) return;
  const headers = headerMap ? Object.values(headerMap) : Object.keys(rows[0] || {});
  const keys = headerMap ? Object.keys(headerMap) : Object.keys(rows[0] || {});
  const csv = [
    headers.join(','),
    ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

