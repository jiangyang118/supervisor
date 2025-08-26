export function exportCsv(filename: string, rows: any[], headers?: Record<string, string>) {
  if (!rows || rows.length === 0) {
    alert('暂无数据可导出');
    return;
  }
  const keys = headers ? Object.keys(headers) : Object.keys(rows[0]);
  const head = headers ? keys.map((k) => headers[k]) : keys;
  const lines = [
    head.join(','),
    ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
