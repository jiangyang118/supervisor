import { Test } from '@nestjs/testing';
import { CameraService } from '../../trustivs/camera.service';
import { TrustivsConfigService } from '../../trustivs/trustivs.config.service';

class MockTrustivsConfigService {
  public calls: any[] = [];
  async request(init: { method: string; path: string; body?: any; headers?: any }) {
    this.calls.push(init);
    if (init.path === '/gatewayGBS/openApi/getCameraByCompany' && init.method === 'POST') {
      return { status: 200, url: 'mock://getCameraByCompany', text: JSON.stringify(mockResp), json: mockResp } as any;
    }
    return { status: 404, url: 'mock://404', text: 'not found' } as any;
  }
}

const mockResp = {
  code: '1',
  data: {
    pageNum: 1,
    pageSize: 10,
    size: 3,
    startRow: 1,
    endRow: 3,
    total: 3,
    pages: 1,
    list: [{ fname: 'Channel3' }, { fname: 'Channel1' }, { fname: 'Channel8' }],
  },
  message: 'SUCCESS',
};

describe('CameraService.getCameraByCompany', () => {
  let svc: CameraService;
  let http: MockTrustivsConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CameraService, { provide: TrustivsConfigService, useClass: MockTrustivsConfigService }],
    }).compile();
    svc = moduleRef.get(CameraService);
    http = moduleRef.get(TrustivsConfigService) as any;
  });

  it('should POST once with correct body and return expected response', async () => {
    const resp: any = await svc.getCameraByCompany({ pageNum: 1, pageSize: 10 });
    expect(resp.code).toBe('1');
    expect(resp.data?.pageNum).toBe(1);
    expect(resp.data?.pageSize).toBe(10);
    expect(Array.isArray(resp.data?.list)).toBe(true);
    expect(resp.data?.list.length).toBe(3);

    expect(http.calls.length).toBe(1);
    const call = http.calls[0];
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/gatewayGBS/openApi/getCameraByCompany');
    expect(call.body).toEqual({
      fthirdcomnum: process.env.ylt_thirdcom || 'cpt0904',
      deviceSn: process.env.ylt_device_sn || 'HQDZKFGBDJGCJ0017',
      pageNum: 1,
      pageSize: 10,
    });
  });
});

