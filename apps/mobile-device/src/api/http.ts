import { request } from '../utils/request'

export { request }

export function get<T>(path: string, cache = false) {
  return request<T>({ path, method: 'GET', cache })
}

export function post<T>(path: string, body: any) {
  return request<T>({ path, method: 'POST', body })
}

