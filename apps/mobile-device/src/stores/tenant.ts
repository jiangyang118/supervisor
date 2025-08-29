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

const LS_SCHOOL = 'FOODSAFE_SELECTED_SCHOOL'
export const selectedSchoolId = ref<string | null>(
  (typeof localStorage !== 'undefined' && localStorage.getItem(LS_SCHOOL)) || null,
)
export const selectedCanteenId = ref<string | null>(null)

export function setSchool(id: string | null) {
  selectedSchoolId.value = id
  // reset canteen if school changes
  if (!id) selectedCanteenId.value = null
  try { if (typeof localStorage !== 'undefined') {
    if (id) localStorage.setItem(LS_SCHOOL, id)
    else localStorage.removeItem(LS_SCHOOL)
  } } catch {}
}

export function setCanteen(id: string | null) {
  selectedCanteenId.value = id
}
