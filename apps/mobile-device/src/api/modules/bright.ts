import { get } from '../http'

export type Camera = {
  schoolId: string
  id: string
  name: string
  online: boolean
  flvUrl?: string
  hlsUrl?: string
}

export function fetchSchoolCameras(schoolId?: string) {
  const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''
  return get<Camera[]>(`/bright/school/cameras${qs}`, false)
}

