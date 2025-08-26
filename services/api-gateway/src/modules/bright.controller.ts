import { Controller, Get, Param } from '@nestjs/common';

@Controller('bright')
export class BrightController {
  @Get('channels')
  channels() {
    return [
      { id: 'ch-01', name: '后厨-操作台', enabled: true },
      { id: 'ch-02', name: '后厨-清洗区', enabled: true },
      { id: 'ch-03', name: '配菜间', enabled: true },
      { id: 'ch-04', name: '备餐间', enabled: false },
    ];
  }

  @Get('start/:schoolId/:cameraId')
  start(@Param('schoolId') schoolId: string, @Param('cameraId') cameraId: string) {
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const key = encodeURIComponent(`${schoolId}-${cameraId}`);
    return {
      flvUrl: `${base}/live/${key}.flv`,
      hlsUrl: `${base}/live/${key}.m3u8`,
    };
  }
}
