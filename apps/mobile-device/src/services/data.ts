import type { Canteen, Device, School } from '../stores/tenant'

// Mock datasets
const schools: School[] = [
  { id: 's1', name: '第一中学' },
  { id: 's2', name: '第二实验学校' },
]

const canteens: Canteen[] = [
  { id: 'c1', schoolId: 's1', name: '一号食堂' },
  { id: 'c2', schoolId: 's1', name: '二号食堂' },
  { id: 'c3', schoolId: 's2', name: '中心食堂' },
]

const devices: Device[] = [
  { id: 'd1', canteenId: 'c1', name: '网关A', type: 'gateway', status: 'online', lastSeen: '2025-08-28 10:12' },
  { id: 'd2', canteenId: 'c1', name: '分析仪B', type: 'analyzer', status: 'offline', lastSeen: '2025-08-27 18:02' },
  { id: 'd3', canteenId: 'c2', name: '温度传感器C', type: 'sensor', status: 'online', lastSeen: '2025-08-29 09:40' },
  { id: 'd4', canteenId: 'c3', name: '摄像头D', type: 'camera', status: 'error', lastSeen: '2025-08-29 08:05' },
]

function delay<T>(value: T, ms = 100): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms))
}

export function fetchSchools(): Promise<School[]> {
  return delay(schools)
}

export function fetchCanteensBySchool(schoolId: string): Promise<Canteen[]> {
  return delay(canteens.filter((c) => c.schoolId === schoolId))
}

export function fetchDevicesByCanteen(canteenId: string): Promise<Device[]> {
  return delay(devices.filter((d) => d.canteenId === canteenId))
}

export function fetchDeviceById(id: string): Promise<Device | undefined> {
  return delay(devices.find((d) => d.id === id))
}

// ---------- Extended mock for business needs ----------
export type SmartCheckItem = {
  id: string
  canteenId: string
  time: string
  rule: string
  level: 'info' | 'warn' | 'error'
  snapshot?: string
}

const smartChecks: SmartCheckItem[] = [
  { id: 'sc1', canteenId: 'c1', time: '08:10', rule: '晨检通过', level: 'info' },
  { id: 'sc2', canteenId: 'c1', time: '10:25', rule: '操作间未戴口罩', level: 'warn' },
  { id: 'sc3', canteenId: 'c1', time: '12:05', rule: '冷藏温度超标', level: 'error' },
  { id: 'sc4', canteenId: 'c2', time: '09:12', rule: '留样标签缺失', level: 'warn' },
]

export function fetchSmartChecks(date: string, canteenId: string) {
  // date 暂不筛选，演示返回对应食堂数据
  return delay(smartChecks.filter((x) => x.canteenId === canteenId))
}

export type Camera = { id: string; canteenId: string; name: string; online: boolean; stream: string }
const cameras: Camera[] = [
  {
    id: 'cam1',
    canteenId: 'c1',
    name: '后厨1号摄像头',
    online: true,
    stream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  { id: 'cam2', canteenId: 'c1', name: '粗加工区', online: false, stream: '' },
  {
    id: 'cam3',
    canteenId: 'c2',
    name: '配餐间',
    online: true,
    stream: 'https://test-streams.mux.dev/test_001/stream.m3u8',
  },
]

export function fetchCameras(canteenId: string): Promise<Camera[]> {
  return delay(cameras.filter((c) => c.canteenId === canteenId))
}

export type DailyReport = {
  date: string
  canteenId: string
  morningCheck: { reported: number; total: number }
  disinfection: { reported: number; total: number }
  waste: { reported: number; total: number }
  sampling: { reported: number; total: number }
  accompanyMeal: { reported: number; total: number }
  hygiene: { reported: number; total: number }
}

export function fetchDailyReport(date: string, canteenId: string): Promise<DailyReport> {
  const base = {
    date,
    canteenId,
    morningCheck: { reported: 3, total: 3 },
    disinfection: { reported: 2, total: 3 },
    waste: { reported: 1, total: 2 },
    sampling: { reported: 1, total: 1 },
    accompanyMeal: { reported: 1, total: 1 },
    hygiene: { reported: 0, total: 1 },
  }
  return delay(base)
}

export type TodoData = {
  date: string
  canteenId: string
  notReportedToday: Array<{ id: string; name: string }>
  hazardTasks: Array<{ id: string; title: string; due: string; status: 'pending' | 'overdue' }>
}

export function fetchTodos(date: string, canteenId: string): Promise<TodoData> {
  const data: TodoData = {
    date,
    canteenId,
    notReportedToday: [
      { id: 'nr1', name: '消毒记录未上报' },
      { id: 'nr2', name: '卫生检查未上报' },
    ],
    hazardTasks: [
      { id: 'hz1', title: '库房堆放杂物清理', due: `${date} 17:00`, status: 'pending' },
      { id: 'hz2', title: '后厨地面积水整改', due: `${date} 15:00`, status: 'overdue' },
    ],
  }
  return delay(data)
}

export type HealthStats = {
  canteenId: string
  total: number
  expired: number
  expiredList: Array<{ userId: string; name: string; expireDate: string }>
}

export function fetchHealthStats(canteenId: string): Promise<HealthStats> {
  const data: HealthStats = {
    canteenId,
    total: 18,
    expired: 3,
    expiredList: [
      { userId: 'u101', name: '张三', expireDate: '2025-08-20' },
      { userId: 'u102', name: '李四', expireDate: '2025-08-22' },
      { userId: 'u103', name: '王五', expireDate: '2025-08-25' },
    ],
  }
  return delay(data)
}
