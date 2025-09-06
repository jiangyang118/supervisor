import { Controller, Get, Headers, Query, Logger } from '@nestjs/common';
import { IotService, type CameraDTO, type PlaySourceDTO } from './iot.service';

type CameraDTO = {
  id: string;
  name: string;
  deviceSn: string;
  channelId: string;
  vendor: 'hik' | 'dahua' | 'gb28181' | 'unknown';
  online: boolean;
  lastSeen?: string;
};

type PlaySourceDTO = {
  cameraId: string;
  hlsUrl?: string;
  flvUrl?: string;
  webrtcUrl?: string;
  rtspUrl?: string;
  token?: string;
  expiresAt?: string;
  mock?: boolean;
};

@Controller('iot')
export class IotController {
  private readonly logger = new Logger('IotController');
  constructor(private readonly iot: IotService) {}
  private demoHls = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  @Get('cameras')
  async cameras(@Query('company') company: string | undefined, @Headers() headers: Record<string, string>) {
    this.logger.log(`GET /api/iot/cameras company=${company || ''}`);
    const cams = await this.iot.cameras({ company }, headers);
    this.logger.log(`/api/iot/cameras result length=${cams?.length || 0}`);
    if (cams && cams.length) return cams;
    // fallback demo list
    const baseName = company || '演示单位';
    const demo: CameraDTO[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `demo-${i + 1}`,
      name: `${baseName} · 摄像头 ${i + 1}`,
      deviceSn: `dev-${Math.floor(i / 2) + 1}`,
      channelId: `ch-${i + 1}`,
      vendor: 'unknown',
      online: true,
      lastSeen: new Date().toISOString(),
    }));
    return demo;
  }

  @Get('streams/play')
  async play(@Query('cameraId') cameraId: string, @Headers() headers: Record<string, string>) {
    if (cameraId?.startsWith('demo-')) {
      this.logger.warn(`/api/iot/streams/play using demo stream cameraId=${cameraId}`);
      const out: PlaySourceDTO = {
        cameraId,
        hlsUrl: this.demoHls,
        mock: true,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      };
      return out;
    }
    const src = await this.iot.play(cameraId, headers);
    if (src?.hlsUrl || src?.flvUrl || src?.rtspUrl || src?.webrtcUrl) {
      this.logger.log(`/api/iot/streams/play success cameraId=${cameraId}`);
      return src;
    }
    this.logger.warn(`/api/iot/streams/play fallback demo cameraId=${cameraId}`);
    return { ...src, hlsUrl: this.demoHls, mock: true };
  }

  @Get('streams/snapshot')
  async snapshot(@Query('cameraId') cameraId: string) {
    return { cameraId, url: 'https://dummyimage.com/800x450/000/fff.png&text=Snapshot' };
  }

  @Get('streams/back')
  async back(
    @Query('cameraId') cameraId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Headers() headers: Record<string, string>,
  ) {
    const list = await this.iot.back(cameraId, start, end, headers);
    return { list };
  }

  @Get('streams/download')
  async download(
    @Query('cameraId') cameraId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Headers() headers: Record<string, string>,
  ) {
    const list = await this.iot.download(cameraId, start, end, headers);
    return { list };
  }
}
