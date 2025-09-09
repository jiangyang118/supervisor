import { defineStore } from 'pinia'

export type Kpi = { title: string; value: number; unit?: string; warn?: boolean }
export type License = { name: string; imageUrl: string }
export type PieItem = { name: string; value: number }
export type Disinfection = { type: string; by: string; at: string }
export type Pesticide = { sample: string; result: '合格'|'不合格'; at: string }
export type Sample = { dish: string; status: '已留样'|'待留样'; at: string }
export type Feedback = { avatar?: string; name: string; role: string; phone: string; qrcode?: string }
export type Sensor = { name: string; value: number; unit: string; abnormal?: boolean; warnAbove?: number; warnBelow?: number }
export type Staff = { name: string; temperature: string; status: '正常'|'异常' }

export const useDashboardStore = defineStore('screen-dashboard', {
  state: () => ({
    kpis: [
      { title: '晨检总人数', value: 52, unit: '人' },
      { title: '异常人数', value: 8, unit: '人', warn: true },
    ] as Kpi[],
    staff: [
      { name: '王小明', temperature: '36.4℃', status: '到期前7天' },
      { name: '李晓', temperature: '36.6℃', status: '到期' },
    ] as unknown as Staff[],
    licenses: [
      { name: '营业执照', imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="144"><rect width="100%" height="100%" fill="%230a1a2a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239dccff" font-size="16">营业执照</text></svg>' },
      { name: '食品经营许可证', imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="144"><rect width="100%" height="100%" fill="%230a1a2a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239dccff" font-size="16">食品经营许可证</text></svg>' },
    ] as License[],
    pie: [
      { name: '未戴口罩', value: 50 },
      { name: '未穿工服', value: 40 },
      { name: '其他', value: 10 },
    ] as PieItem[],
    disinfections: [
      { type: '环境消毒', by: '王五', at: '08:10' },
      { type: '餐具消毒', by: '赵六', at: '08:30' },
      { type: '案台消毒', by: '李四', at: '09:00' },
      { type: '冷库消毒', by: '王五', at: '09:20' },
      { type: '地面消毒', by: '赵六', at: '09:45' },
      { type: '垃圾桶消毒', by: '陈七', at: '10:05' },
      { type: '刀具消毒', by: '李四', at: '10:20' },
      { type: '抹布消毒', by: '王五', at: '10:40' },
      { type: '冰箱把手消毒', by: '赵六', at: '11:00' },
      { type: '餐桌消毒', by: '陈七', at: '11:15' },
      { type: '环境消毒', by: '王五', at: '11:30' },
      { type: '餐具消毒', by: '赵六', at: '11:45' },
    ] as Disinfection[],
    pesticides: [
      { sample: '小羊肉', result: '合格', at: '09:10' },
      { sample: '黄花鱼', result: '合格', at: '09:30' },
      { sample: '小青菜', result: '合格', at: '10:00' },
      { sample: '大米', result: '合格', at: '11:00' },
      { sample: '西红柿', result: '合格', at: '11:10' },
      { sample: '黄瓜', result: '合格', at: '11:20' },
      { sample: '茄子', result: '合格', at: '11:30' },
      { sample: '土豆', result: '合格', at: '11:40' },
      { sample: '胡萝卜', result: '合格', at: '11:50' },
      { sample: '大白菜', result: '合格', at: '12:00' },
      { sample: '生菜', result: '合格', at: '12:10' },
      { sample: '青椒', result: '合格', at: '12:20' },
    ] as Pesticide[],
    samples: [
      { dish: '炒羊肉', status: '已留样', at: '10:30' },
      { dish: '清蒸鱼', status: '已留样', at: '11:00' },
      { dish: '炒胡萝卜', status: '待留样', at: '11:20' },
      { dish: '红烧肉', status: '已留样', at: '11:25' },
      { dish: '土豆丝', status: '已留样', at: '11:28' },
      { dish: '青椒肉丝', status: '待留样', at: '11:32' },
      { dish: '鱼香茄子', status: '已留样', at: '11:36' },
      { dish: '宫保鸡丁', status: '已留样', at: '11:40' },
      { dish: '西红柿鸡蛋', status: '已留样', at: '11:45' },
      { dish: '炒青菜', status: '待留样', at: '11:48' },
      { dish: '蒜蓉生菜', status: '已留样', at: '11:52' },
      { dish: '玉米排骨汤', status: '已留样', at: '11:56' },
    ] as Sample[],
    feedbacks: [
      { name: '张三', role: '食堂负责人', phone: '165****2222' },
      { name: '李四', role: '用餐反馈人', phone: '187****6666' },
      
    ] as Feedback[],
    sensors: [
      { name: '冷库温度', value: 3.6, unit: '℃', warnAbove: 5 },
      { name: '后厨温度', value: 29.3, unit: '℃', warnAbove: 28 },
      { name: '可燃气体', value: 0.7, unit: '%LEL', warnAbove: 0.5 },
    ] as Sensor[],
    videos: [
      { title: '后厨-操作台', poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23003157"/><stop offset="1" stop-color="%23001b2e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23cde7ff" font-size="16">操作台</text></svg>' },
      { title: '后厨-清洗区', poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23003157"/><stop offset="1" stop-color="%23001b2e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23cde7ff" font-size="16">清洗区</text></svg>' },
      { title: '配菜间', poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23003157"/><stop offset="1" stop-color="%23001b2e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23cde7ff" font-size="16">配菜间</text></svg>' },
      { title: '备餐间', poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23003157"/><stop offset="1" stop-color="%23001b2e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23cde7ff" font-size="16">备餐间</text></svg>' },
    ] as Array<{ title: string; poster?: string }>,
  }),
})
