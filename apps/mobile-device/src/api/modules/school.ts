import { get } from '../http'

export type RegSchool = { id: number; name: string }

export function fetchRegSchools() {
  return get<RegSchool[]>('/reg/schools', true)
}
