export function parseRange(range: string): [number, number] {
  const [minStr, maxStr] = range.split('-').map((s) => s.trim());
  const min = Number(minStr);
  const max = Number(maxStr);
  if (!isFinite(min) || !isFinite(max)) {
    return [35.9, 37.3];
  }
  return [min, max];
}

export function abnormalTempFlag(temp: number, range: string | [number, number]): 0 | 1 {
  const [min, max] = Array.isArray(range) ? range : parseRange(range);
  if (temp < min || temp > max) return 1;
  return 0;
}

export function splitCsv(s?: string): string[] {
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export function computeHealth(
  abnormalTemp: 0 | 1,
  handCheckCsv?: string,
  healthAskCsv?: string
): 0 | 1 {
  const hand = splitCsv(handCheckCsv);
  const ask = splitCsv(healthAskCsv);
  const ok = abnormalTemp === 0 && hand.length === 0 && ask.length === 0;
  return ok ? 0 : 1;
}

