export function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
export function formatYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
export function formatHMS(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
export function weekText(d: Date) {
  return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
}

