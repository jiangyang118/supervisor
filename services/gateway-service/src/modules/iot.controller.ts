import { Controller, Get, Headers, Query, Logger, NotFoundException } from '@nestjs/common';
import { IotService, type CameraDTO, type PlaySourceDTO } from './iot.service';

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
    return Array.isArray(cams) ? cams : [];
  }

  @Get('streams/play')
  async play(@Query('cameraId') cameraId: string, @Headers() headers: Record<string, string>) {
    const src = await this.iot.play(cameraId, headers);
    if (src?.hlsUrl || src?.flvUrl || src?.rtspUrl || src?.webrtcUrl) {
      this.logger.log(`/api/iot/streams/play success cameraId=${cameraId}`);
      return src;
    }
    this.logger.warn(`/api/iot/streams/play no playable source cameraId=${cameraId}`);
    throw new NotFoundException('No playable source for camera');
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
