import { get } from '../http'

export type DailyReport = {
  kpi: {
    morning: number
    sampling: number
    disinfection: number
    dine: number
    waste: number
    ai: number
    inboundCount: number
    outboundCount: number
    inboundQty: number
    outboundQty: number
    hygienePassRate: number
    deviceOnlineRate: number
  }
  aiByType: Array<{ type: string; count: number }>
}

export function fetchSchoolDaily(schoolId?: string) {
  const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''
  return get<DailyReport>(`/reports/school/daily${qs}`)
}

