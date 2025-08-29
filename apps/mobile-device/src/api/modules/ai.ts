import { get } from '../http'

export type AiEvent = {
  id: string
  typeCode: string
  typeLabel: string
  camera: string
  snapshot: string
  at: string
  status: 'OPEN' | 'ACK' | 'CLOSED'
  measure?: string
}

export function fetchAiEvents(params: { schoolId?: string; page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams()
  if (params.schoolId) q.set('schoolId', params.schoolId)
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  return get<{ items: AiEvent[]; total: number; page: number; pageSize: number }>(`/school/ai/events?${q.toString()}`)
}

