import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class AnalyticsService {
  private events$ = new Subject<MessageEvent>();
  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  private nowISO() {
    return new Date().toISOString();
  }

  stream(): Observable<MessageEvent> {
    // push a hello event
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  dashboard(params?: { schoolId?: string }) {
    const aiAlerts = this.rand(5, 18);
    const morningChecks = this.rand(10, 40);
    const inboundCount = this.rand(6, 20);
    const inboundWeightKg = this.rand(50, 200);
    const satisfaction = this.rand(85, 98);
    const canteenStaff = { total: 18, healthCertValid: 16, invalid: 2 };
    const hygieneReports = this.rand(5, 15);
    const inboundItems = [
      { name: '大米', qty: this.rand(5, 20) },
      { name: '蔬菜', qty: this.rand(10, 40) },
      { name: '肉类', qty: this.rand(5, 15) },
    ];
    const inboundMode = [
      { mode: '手工', value: this.rand(10, 30) },
      { mode: '云导入', value: this.rand(5, 15) },
      { mode: '地磅', value: this.rand(5, 12) },
    ];
    const dishesToday = ['土豆丝', '青椒肉丝', '鱼香肉丝', '西红柿炒蛋'].map((d) => ({ name: d }));
    const outboundItems = [
      { name: '大米', qty: this.rand(5, 12) },
      { name: '蔬菜', qty: this.rand(8, 20) },
    ];
    const outboundPurpose = [
      { purpose: '早餐', value: this.rand(2, 8) },
      { purpose: '午餐', value: this.rand(6, 18) },
      { purpose: '晚餐', value: this.rand(3, 10) },
    ];
    const warnings = Array.from({ length: this.rand(2, 6) }).map((_, i) => ({
      id: `W-${i + 1}`,
      type: ['AI', '设备', '卫生'][this.rand(0, 2)],
      title: ['未戴帽', '温度异常', '台面不洁'][this.rand(0, 2)],
      at: this.nowISO(),
      level: ['一般', '较大', '重大'][this.rand(0, 2)],
    }));
    return {
      cards: {
        aiAlerts,
        morningChecks,
        inboundCount,
        inboundWeightKg,
        satisfaction,
        hygieneReports,
      },
      canteenStaff,
      inbound: { items: inboundItems, mode: inboundMode },
      outbound: { items: outboundItems, purpose: outboundPurpose },
      dishesToday,
      warnings,
    };
  }

  foodIndex(params?: { schoolId?: string }) {
    const score = this.rand(85, 98);
    const submetrics = [
      { metric: '综合得分', value: score },
      { metric: 'AI 行为规范', value: this.rand(80, 98) },
      { metric: '冷链温控', value: this.rand(80, 98) },
      { metric: '操作卫生', value: this.rand(80, 98) },
      { metric: '人员健康', value: this.rand(80, 98) },
    ];
    return { score, submetrics };
  }
}
