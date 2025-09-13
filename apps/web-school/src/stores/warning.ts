import { defineStore } from 'pinia';
import { api } from '../services/api';

export type WarningStatus = '未处理' | '已处理';
export type DatePreset = 'today' | '7d' | '30d' | 'custom';

export type WarningItem = {
  id: string;
  type: string;
  title: string;
  location: string;
  at: string; // ISO
  status: WarningStatus;
};

export const TYPE_ENUM = [
  { label: '资质证书过期（人员资质证件、供应商资质、食堂资质）', value: '资质证书过期' },
  { label: '食材过期预警', value: '食材过期预警' },
  { label: '日常行为AI预警', value: '日常行为AI预警' },
  { label: '环境监测异常', value: '环境监测异常' },
  { label: '农残检测', value: '农残检测' },
  { label: '晨检异常', value: '晨检异常' },
  { label: '设备安全异常（设备安全检查结果不通过提示异常）', value: '设备安全异常' },
  { label: '消毒管理（当日未提交消毒记录提示异常）', value: '消毒管理' },
] as const;

export const STATUS_ENUM = [
  { label: '全部', value: undefined },
  { label: '未处理', value: '未处理' as WarningStatus },
  { label: '已处理', value: '已处理' as WarningStatus },
] as const;

function toISOStartEnd(preset: DatePreset, custom?: [string, string] | null) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmtDay = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  if (preset === 'today') {
    const s = startOfDay;
    const e = new Date(startOfDay);
    return { start: fmtDay(s), end: fmtDay(e) };
  }
  if (preset === '7d') {
    const s = new Date(startOfDay); s.setDate(s.getDate() - 6);
    const e = new Date(startOfDay);
    return { start: fmtDay(s), end: fmtDay(e) };
  }
  if (preset === '30d') {
    const s = new Date(startOfDay); s.setDate(s.getDate() - 29);
    const e = new Date(startOfDay);
    return { start: fmtDay(s), end: fmtDay(e) };
  }
  if (preset === 'custom' && custom && custom.length === 2) {
    const [startStr, endStr] = custom;
    const parse = (s: string) => new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
    const s = parse(startStr);
    const e = parse(endStr);
    return { start: fmtDay(s), end: fmtDay(e) };
  }
  return {} as { start?: string; end?: string };
}

export const useWarningStore = defineStore('warning', {
  state: () => ({
    items: [] as WarningItem[],
    loading: false,
    selected: [] as string[],
    // filters
    types: [] as string[], // value from TYPE_ENUM.value (后端类型)
    statusLabel: '全部' as '全部' | WarningStatus,
    datePreset: 'today' as DatePreset,
    customRange: null as [string, string] | null,
    schoolId: undefined as string | undefined,
    summary: [] as Array<{ name: string; count: number }>,
  }),
  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const { start, end } = toISOStartEnd(this.datePreset, this.customRange);
        const data = await api.analyticsAlerts({
          schoolId: this.schoolId,
          start, end,
          // 后端仅支持单类型/状态筛选：先不传，前端做类型/状态多选过滤
        });
        const rows = (data.items || []) as Array<{ id: string; type: string; status: WarningStatus; at: string; level?: string; detail?: string; school?: string }>;
        // 映射为页面字段
        const items: WarningItem[] = rows.map((r) => {
          const type = r.type === '证件过期' || r.type === '健康证到期' ? '资质证书过期' : r.type;
          return {
          id: r.id,
          type,
          title: r.detail || r.type,
          location: r.school || '-',
          at: r.at,
          status: r.status || '未处理',
          };
        });
        // 前端过滤：类型/状态
        const typeSet = new Set(this.types.filter(Boolean));
        const filteredByType = typeSet.size ? items.filter((it) => typeSet.has(it.type)) : items;
        const filteredByStatus = this.statusLabel === '全部' ? filteredByType : filteredByType.filter((it) => it.status === this.statusLabel);
        // 排序：时间倒序
        filteredByStatus.sort((a, b) => (a.at < b.at ? 1 : -1));
        this.items = filteredByStatus;
        // 汇总
        const map = new Map<string, number>();
        this.items.forEach((x) => map.set(x.type, (map.get(x.type) || 0) + 1));
        this.summary = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
      } finally {
        this.loading = false;
      }
    },
    async markAsProcessed(ids: string[], measure?: string) {
      const set = new Set(ids);
      // call backend for each id with its type
      const tasks = this.items
        .filter((it) => set.has(it.id))
        .map(async (it) => {
          try { await api.analyticsAlertHandle({ id: it.id, type: it.type, measure: measure || '已处理' }); } catch {}
        });
      await Promise.all(tasks);
      // update local state
      this.items = this.items.map((it) => (set.has(it.id) ? { ...it, status: '已处理' } : it));
      this.selected = [];
    },
    setSelection(ids: string[]) { this.selected = ids; },
  },
});
