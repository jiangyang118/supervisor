import { ref } from 'vue'

export type School = { id: string; name: string }
export type Canteen = { id: string; schoolId: string; name: string }
export type Device = {
  id: string
  canteenId: string
  name: string
  type: 'gateway' | 'sensor' | 'camera' | 'analyzer'
  status: 'online' | 'offline' | 'error'
  lastSeen?: string
}

export const selectedSchoolId = ref<string | null>(null)
export const selectedCanteenId = ref<string | null>(null)

export function setSchool(id: string | null) {
  selectedSchoolId.value = id
  // reset canteen if school changes
  if (!id) selectedCanteenId.value = null
}

export function setCanteen(id: string | null) {
  selectedCanteenId.value = id
}

