import { abnormalTempFlag, computeHealth, parseRange } from '../src/utils/healthLogic';

describe('healthLogic', () => {
  test('parseRange', () => {
    expect(parseRange('35.9-37.3')).toEqual([35.9, 37.3]);
  });
  test('abnormal flag', () => {
    expect(abnormalTempFlag(36.5, '35.9-37.3')).toBe(0);
    expect(abnormalTempFlag(38.1, '35.9-37.3')).toBe(1);
  });
  test('compute health', () => {
    expect(computeHealth(0, '', '')).toBe(0);
    expect(computeHealth(1, '', '')).toBe(1);
    expect(computeHealth(0, '异物', '')).toBe(1);
    expect(computeHealth(0, '', '发烧')).toBe(1);
  });
});

