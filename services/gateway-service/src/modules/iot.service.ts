import { Injectable } from '@nestjs/common';
import { TrustivsListService } from './trustivs/service/list.service';
import { TrustivsStreamService } from './trustivs/service/stream.service';
import { TrustivsPlaybackService } from './trustivs/service/playback.service';
import { CameraService } from './trustivs/camera.service';

export type CameraDTO = {
  id: string;
  name: string;
  deviceSn: string;
  channelId: string;
  vendor: 'hik' | 'dahua' | 'gb28181' | 'unknown';
  online: boolean;
  lastSeen?: string;
  // Optional inline sources from getCameraByCompany
  hls?: string;
  flv?: string;
  webrtc?: string;
  wsFlv?: string;
  rtmp?: string;
};

export type PlaySourceDTO = {
  cameraId: string;
  hlsUrl?: string;
  flvUrl?: string;
  webrtcUrl?: string;
  rtspUrl?: string;
  token?: string;
  expiresAt?: string;
  mock?: boolean;
};

@Injectable()
export class IotService {
  constructor(
    private readonly listSvc: TrustivsListService,
    private readonly streamSvc: TrustivsStreamService,
    private readonly playbackSvc: TrustivsPlaybackService,
    private readonly cameraSvc: CameraService,
  ) {}

  private pick<T = any>(o: any, keys: string[], def?: any): T | any {
    for (const k of keys) {
      if (o && o[k] !== undefined && o[k] !== null) return o[k];
    }
    return def;
  }

  // Build id as `${deviceSn}|${channelId}` to be able to split later
  private toCameraDTO(it: any): CameraDTO | null {
    const name = this.pick<string>(it, ['fname', 'name', 'cameraName']);
    const deviceSn = this.pick<string>(it, ['deviceSn', 'fdeviceid', 'deviceId']);
    const channelId = this.pick<string>(it, ['fnationcode', 'code', 'channelId', 'channel']);
    const deviceId = this.pick<string>(it, ['deviceId']);
    if (!name || !deviceSn || !channelId) return null;
    const vendorRaw = String(this.pick<string>(it, ['vendor', 'type']) || 'unknown').toLowerCase();
    const vendor = (['hik', 'dahua', 'gb28181'].includes(vendorRaw) ? vendorRaw : 'unknown') as any;
    const id = `${deviceId || deviceSn}|${channelId}`;
    const status = String(this.pick<string>(it, ['status']) || '').toUpperCase();
    return {
      id,
      name,
      deviceSn,
      channelId,
      vendor,
      online: status ? status === 'ON' : true,
      lastSeen: new Date().toISOString(),
      hls: this.pick<string>(it, ['hls']),
      flv: this.pick<string>(it, ['flv']),
      webrtc: this.pick<string>(it, ['webrtc']),
      wsFlv: this.pick<string>(it, ['ws_flv', 'wsFlv']),
      rtmp: this.pick<string>(it, ['rtmp']),
    };
  }

  async cameras(params: { company?: string; force?: boolean }, headers?: Record<string, string>): Promise<CameraDTO[]> {
    try {
      const payload: any = await this.cameraSvc.getCameraByCompany({ pageNum: 1, pageSize: 50 });
      const data = payload?.data ?? payload;
      const arr = Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data)
          ? data
          : [];
      const out: CameraDTO[] = [];
      for (const it of arr) {
        const dto = this.toCameraDTO(it);
        if (dto) out.push(dto);
      }
      return out;
    } catch (e) {
      // fallback to empty; controller may wrap with mock
      return [];
    }
  }

  async play(cameraId: string, headers?: Record<string, string>): Promise<PlaySourceDTO> {
    // cameraId encodes deviceSn|channelId
    const [serial, code] = String(cameraId || '').split('|');
    const body: any = {
      serial: serial || process.env.YLT_DEVICE_SN || process.env.TRUSTIVS_DEVICE_SN,
      code: code || process.env.YLT_CHANNEL_CODE || process.env.TRUSTIVS_CHANNEL_CODE,
      type: 'hls',
    };
    try {
      const data = await this.streamSvc.getStreamURL(body, headers);
      const hlsUrl = this.pick<string>(data, ['hlsUrl', 'm3u8', 'url']);
      const flvUrl = this.pick<string>(data, ['flv', 'flvUrl']);
      const rtspUrl = this.pick<string>(data, ['rtsp', 'rtspUrl']);
      const webrtcUrl = this.pick<string>(data, ['webrtc', 'webrtcUrl']);
      return { cameraId, hlsUrl, flvUrl, rtspUrl, webrtcUrl, token: this.pick<string>(data, ['token']), expiresAt: this.pick<string>(data, ['expiresAt']) };
    } catch (e) {
      return { cameraId, hlsUrl: undefined, mock: true };
    }
  }

  async back(cameraId: string, start: string, end: string, headers?: Record<string, string>): Promise<any> {
    const [serial, code] = String(cameraId || '').split('|');
    const q: any = {
      serial: serial || process.env.YLT_DEVICE_SN || process.env.TRUSTIVS_DEVICE_SN,
      code: code || process.env.YLT_CHANNEL_CODE || process.env.TRUSTIVS_CHANNEL_CODE,
      starttime: start,
      endtime: end,
    };
    try {
      const data = await (this as any).playbackSvc?.getBackUrl?.(q, headers);
      return data ?? [];
    } catch {
      return [];
    }
  }

  async download(cameraId: string, start: string, end: string, headers?: Record<string, string>): Promise<any> {
    const [serial, code] = String(cameraId || '').split('|');
    const q: any = {
      serial: serial || process.env.YLT_DEVICE_SN || process.env.TRUSTIVS_DEVICE_SN,
      code: code || process.env.YLT_CHANNEL_CODE || process.env.TRUSTIVS_CHANNEL_CODE,
      starttime: start,
      endtime: end,
    };
    try {
      const data = await (this as any).playbackSvc?.getDownloadUrl?.(q, headers);
      return data ?? [];
    } catch {
      return [];
    }
  }
}
