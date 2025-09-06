import { API_BASE } from '../services/api';

export interface CameraDTO {
  id: string;
  name: string;
  deviceSn: string;
  channelId: string;
  vendor: 'hik' | 'dahua' | 'gb28181' | 'unknown';
  online: boolean;
  lastSeen?: string;
  hls?: string;
  flv?: string;
  webrtc?: string;
  wsFlv?: string;
  rtmp?: string;
}

export interface PlaySourceDTO {
  cameraId: string;
  hlsUrl?: string;
  flvUrl?: string;
  webrtcUrl?: string;
  rtspUrl?: string;
  token?: string;
  expiresAt?: string;
  mock?: boolean;
}

export const streamsApi = {
  async cameras(company?: string): Promise<CameraDTO[]> {
    const qs = company ? `?company=${encodeURIComponent(company)}` : '';
    const res = await fetch(`${API_BASE}/iot/cameras${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async play(cameraId: string): Promise<PlaySourceDTO> {
    const res = await fetch(`${API_BASE}/iot/streams/play?cameraId=${encodeURIComponent(cameraId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async back(cameraId: string, start: string, end: string): Promise<string[]> {
    const url = `${API_BASE}/iot/streams/back?cameraId=${encodeURIComponent(cameraId)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const list = (j?.list && Array.isArray(j.list)) ? j.list : [];
    // flatten any object to string if needed
    return list.map((x: any) => typeof x === 'string' ? x : (x?.hls || x?.url || x?.flv || '')) .filter(Boolean);
  },
  async download(cameraId: string, start: string, end: string): Promise<string[]> {
    const url = `${API_BASE}/iot/streams/download?cameraId=${encodeURIComponent(cameraId)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const list = (j?.list && Array.isArray(j.list)) ? j.list : [];
    return list.map((x: any) => typeof x === 'string' ? x : (x?.url || x?.hls || x?.flv || '')) .filter(Boolean);
  },
};
