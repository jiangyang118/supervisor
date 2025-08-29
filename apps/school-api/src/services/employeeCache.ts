import fetch from 'node-fetch';
import { Employee, UpstreamEmployee } from '../types';

function mapEmployee(u: UpstreamEmployee): Employee {
  return {
    userId: String(u.userId),
    name: u.name,
    post: u.post,
    portraitUrl: u.portraitPhoto,
    healthNumber: u.healthNumber,
    healthStartTime: u.healthStartTime,
    healthEndTime: u.healthEndTime,
    healthCertUrl: u.healthUrl,
    updateTime: u.updateTime,
  };
}

export async function fetchEmployees(baseUrl: string, equipmentCode: string): Promise<Employee[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/device/morningChecker/employeeList?equipmentCode=${encodeURIComponent(
    equipmentCode
  )}`;
  const res = await fetch(url);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    data = JSON.parse(text.slice(start, end + 1));
  }
  const arr: UpstreamEmployee[] = Array.isArray(data?.data) ? data.data : [];
  return arr.map(mapEmployee);
}

