import { Controller, Get } from '@nestjs/common';

type Inbound = { date: string; item: string; qty: number; supplier: string };
type Outbound = { date: string; item: string; qty: number; purpose: string };
type Hygiene = { date: string; item: string; result: '合格' | '不合格' };
type Device = { id: string; type: string; status: '在线' | '离线' };
type ParentFeedback = { parent: string; rating: number; comment: string };

function today() {
  return new Date().toLocaleDateString();
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Controller('home')
export class HomeController {
  @Get('inbound')
  inbound(): Inbound[] {
    return [
      { date: today(), item: '大米', qty: rand(30, 60), supplier: '供货商A' },
      { date: today(), item: '鸡蛋', qty: rand(80, 120), supplier: '供货商B' },
    ];
  }

  @Get('outbound')
  outbound(): Outbound[] {
    return [
      { date: today(), item: '大米', qty: rand(5, 15), purpose: '午餐' },
      { date: today(), item: '蔬菜', qty: rand(10, 25), purpose: '晚餐' },
    ];
  }

  @Get('hygiene')
  hygiene(): Hygiene[] {
    const ok = () => (Math.random() < 0.9 ? '合格' : '不合格') as const;
    return [
      { date: today(), item: '操作台', result: ok() },
      { date: today(), item: '餐具消毒', result: ok() },
    ];
  }

  @Get('devices')
  devices(): Device[] {
    const s = () => (Math.random() < 0.85 ? '在线' : '离线') as const;
    return [
      { id: 'GW-001', type: '网关', status: s() },
      { id: 'CAM-001', type: '摄像头', status: s() },
      { id: 'SCALE-001', type: '留样秤', status: s() },
    ];
  }

  @Get('parent-feedback')
  parentFeedback(): ParentFeedback[] {
    const names = ['家长A', '家长B', '家长C', '家长D', '家长E'];
    const comments = ['孩子说菜不错', '干净卫生', '希望提升口味'];
    return Array.from({ length: 5 }).map((_, i) => ({
      parent: names[i],
      rating: rand(3, 5),
      comment: comments[rand(0, comments.length - 1)],
    }));
  }
}
