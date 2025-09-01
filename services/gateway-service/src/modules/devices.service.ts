import { Injectable } from '@nestjs/common';
import {
  DeviceStatusEnum,
  DeviceTypeEnum,
  type DeviceType,
  type DeviceStatus,
} from '../../../../libs/shared/models';

export type DeviceInfo = {
  id: string;
  schoolId: string;
  type: DeviceType;
  name: string;
  status: DeviceStatus;
  lastSeen: string;
  location?: string;
  model?: string;
  sn?: string;
  ip?: string;
  firmware?: string;
  metrics?: { [k: string]: number | string };
};

@Injectable()
export class DevicesService {
  private seq = 1;
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(3, '0')}`;
  }
  private nowISO() {
    return new Date().toISOString();
  }
  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private items: DeviceInfo[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const sid = 'sch-001';
    const online = () => (Math.random() < 0.85 ? 'ONLINE' : 'OFFLINE') as DeviceStatus;
    this.items = [
      {
        id: this.id('GW'),
        schoolId: sid,
        type: 'GATEWAY',
        name: '主网关',
        status: online(),
        lastSeen: this.nowISO(),
        location: '配电间',
        model: 'GW-100',
        sn: 'GW100-AAA',
        ip: '10.0.0.2',
        firmware: '1.0.3',
      },
      {
        id: this.id('CAM'),
        schoolId: sid,
        type: 'CAMERA',
        name: '后厨-操作台',
        status: online(),
        lastSeen: this.nowISO(),
        location: '后厨',
        model: 'IPC-200',
        sn: 'IPC200-BBB',
        ip: '10.0.0.21',
        firmware: '2.4.1',
      },
      {
        id: this.id('SCL'),
        schoolId: sid,
        type: 'SCALE',
        name: '留样秤A-1',
        status: online(),
        lastSeen: this.nowISO(),
        location: '留样间',
        model: 'S-50',
        sn: 'S50-CCC',
        ip: '10.0.0.31',
        firmware: '0.9.8',
        metrics: { battery: this.rand(40, 100) },
      },
      {
        id: this.id('TMP'),
        schoolId: sid,
        type: 'SENSOR',
        name: '冷库温控',
        status: online(),
        lastSeen: this.nowISO(),
        location: '冷库',
        model: 'T-10',
        sn: 'T10-DDD',
        ip: '10.0.0.41',
        firmware: '1.2.0',
        metrics: { temp: this.rand(0, 8) },
      },
      {
        id: this.id('SMK'),
        schoolId: sid,
        type: 'SMOKE',
        name: '烟感-一层',
        status: online(),
        lastSeen: this.nowISO(),
        location: '一层走廊',
        model: 'SM-1',
        sn: 'SM1-EEE',
        ip: '10.0.0.51',
        firmware: '1.0.0',
      },
    ];
  }

  list(params?: { schoolId?: string; type?: string; status?: string; q?: string }) {
    let arr = [...this.items];
    if (params?.schoolId) arr = arr.filter((x) => x.schoolId === params.schoolId);
    if (params?.type) arr = arr.filter((x) => x.type === params.type);
    if (params?.status) arr = arr.filter((x) => x.status === params.status);
    if (params?.q) {
      const q = params.q.toLowerCase();
      arr = arr.filter((x) =>
        [x.id, x.name, x.sn, x.ip].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    return arr;
  }

  types() {
    return DeviceTypeEnum.options;
  }
  statuses() {
    return DeviceStatusEnum.options;
  }
}
