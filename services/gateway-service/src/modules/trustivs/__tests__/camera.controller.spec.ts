import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CameraController } from '../../trustivs/camera.controller';
import { CameraService } from '../../trustivs/camera.service';
import { TrustivsConfigService } from '../../trustivs/trustivs.config.service';
import { ApiKeyGuard } from '../../trustivs/api-key.guard';
import { HeaderValidationInterceptor } from '../../trustivs/header-validation.interceptor';
import { TransformResponseInterceptor } from '../../trustivs/transform-response.interceptor';

class MockTrustivsConfigService {
  public last: any = null;
  async request(init: { method: string; path: string; body?: any; headers?: any }) {
    this.last = init;
    if (init.path.includes('/getCameraByCompany')) {
      return {
        status: 200,
        url: 'mock://trustivs/getCameraByCompany',
        text: JSON.stringify(mockResponse),
        json: mockResponse,
      };
    }
    return { status: 404, url: 'mock://404', text: 'not found' } as any;
  }
}

const mockResponse = {
  code: '1',
  data: {
    pageNum: 1,
    pageSize: 10,
    size: 3,
    startRow: 1,
    endRow: 3,
    total: 3,
    pages: 1,
    list: [
      {
        deviceId: '34020000001190904001',
        fname: 'Channel3',
        deviceHostIp: '',
        status: 'ON',
        deviceSn: 'HQDZKFGBDJGCJ0017',
        updateTime: '2025-09-06 10:45:59',
        fnationcode: '34020000001190904013',
        flv: 'http://trustivs.biokee.com/sms/34020000002020000001/flv/hls/34020000001190904001_34020000001190904013.flv',
        hls: 'http://trustivs.biokee.com/sms/34020000002020000001/hls/34020000001190904001_34020000001190904013/live.m3u8',
        rtmp: 'rtmp://14.116.138.242:11935/hls/34020000001190904001_34020000001190904013',
        webrtc: 'webrtc://trustivs.biokee.com/sms/34020000002020000001/rtc/34020000001190904001_34020000001190904013',
        ws_flv: 'ws://trustivs.biokee.com/sms/34020000002020000001/ws-flv/hls/34020000001190904001_34020000001190904013.flv',
      },
      {
        deviceId: '34020000001190904001',
        fname: 'Channel1',
        deviceHostIp: '',
        status: 'ON',
        deviceSn: 'HQDZKFGBDJGCJ0017',
        updateTime: '2025-09-06 10:45:59',
        fnationcode: '34020000001190904011',
        flv: 'http://trustivs.biokee.com/sms/34020000002020000001/flv/hls/34020000001190904001_34020000001190904011.flv',
        hls: 'http://trustivs.biokee.com/sms/34020000002020000001/hls/34020000001190904001_34020000001190904011/live.m3u8',
        rtmp: 'rtmp://14.116.138.242:11935/hls/34020000001190904001_34020000001190904011',
        webrtc: 'webrtc://trustivs.biokee.com/sms/34020000002020000001/rtc/34020000001190904001_34020000001190904011',
        ws_flv: 'ws://trustivs.biokee.com/sms/34020000002020000001/ws-flv/hls/34020000001190904001_34020000001190904011.flv',
      },
      {
        deviceId: '34020000001190904001',
        fname: 'Channel8',
        deviceHostIp: '',
        status: 'ON',
        deviceSn: 'HQDZKFGBDJGCJ0017',
        updateTime: '2025-09-06 10:45:59',
        fnationcode: '34020000001190904018',
        flv: 'http://trustivs.biokee.com/sms/34020000002020000001/flv/hls/34020000001190904001_34020000001190904018.flv',
        hls: 'http://trustivs.biokee.com/sms/34020000002020000001/hls/34020000001190904001_34020000001190904018/live.m3u8',
        rtmp: 'rtmp://14.116.138.242:11935/hls/34020000001190904001_34020000001190904018',
        webrtc: 'webrtc://trustivs.biokee.com/sms/34020000002020000001/rtc/34020000001190904001_34020000001190904018',
        ws_flv: 'ws://trustivs.biokee.com/sms/34020000002020000001/ws-flv/hls/34020000001190904001_34020000001190904018.flv',
      },
    ],
  },
  message: 'SUCCESS',
};

describe('TrustIVS CameraController (e2e-ish)', () => {
  let app: INestApplication;
  let mockHttp: MockTrustivsConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CameraController],
      providers: [
        CameraService,
        { provide: TrustivsConfigService, useClass: MockTrustivsConfigService },
        { provide: ApiKeyGuard, useValue: { canActivate: () => true } },
      ],
    })
      .overrideInterceptor(HeaderValidationInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideInterceptor(TransformResponseInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    mockHttp = moduleRef.get(TrustivsConfigService) as any;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should POST getCameraByCompany with correct body and return expected data', async () => {
    const res = await request(app.getHttpServer())
      .get('/gatewayGBS/openApi/getCameraByCompany?pageNum=1&pageSize=10')
      .set('time', String(Date.now()))
      .set('uuid', 'cpt')
      .set('token', 'dummy')
      .expect(200);

    // Assert response shape
    expect(res.body.code).toBe('1');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.pageNum).toBe(1);
    expect(res.body.data.pageSize).toBe(10);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBe(3);
    expect(res.body.data.list[0].fname).toBeDefined();

    // Assert upstream request body
    expect(mockHttp.last).toBeTruthy();
    expect(mockHttp.last.method).toBe('POST');
    expect(mockHttp.last.path).toContain('/gatewayGBS/openApi/getCameraByCompany');
    expect(mockHttp.last.body).toEqual({
      fthirdcomnum: process.env.ylt_thirdcom || 'cpt0904',
      deviceSn: process.env.ylt_device_sn || 'HQDZKFGBDJGCJ0017',
      pageNum: 1,
      pageSize: 10,
    });
  });
});
