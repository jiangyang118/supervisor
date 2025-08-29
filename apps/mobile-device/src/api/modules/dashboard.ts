import { get } from '../http'

export type DashboardCards = {
  aiAlerts: number
  morningChecks: number
  inboundCount: number
  inboundWeightKg: number
  satisfaction: number
  hygieneReports: number
}

export type DashboardResponse = {
  cards: DashboardCards
  canteenStaff: { total: number; healthCertValid: number; invalid: number }
  inbound: { items: Array<{ name: string; qty: number }>; mode: Array<{ mode: string; value: number }> }
  outbound: { items: Array<{ name: string; qty: number }>; purpose: Array<{ purpose: string; value: number }> }
  dishesToday: Array<{ name: string }>
  warnings: Array<{ id: string; type: string; title: string; at: string; level: string }>
}

export async function fetchDashboard(schoolId?: string): Promise<DashboardResponse> {
  // Preferred endpoint implemented in api-gateway
  const path = `/school/analytics/dashboard${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`
  return await get<DashboardResponse>(path, false)
}

