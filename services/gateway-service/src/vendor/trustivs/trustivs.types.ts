// Selected types derived from prompt/bright/trustivs_openapi_3_1.json
export type StdResponse<T = any> = { code: '1' | '0' | string; message?: string; data?: T };
export type Paged<T = any> = { pageNum?: number; pageSize?: number; total?: number; pages?: number; list?: T[] };

export interface Company {
  fnumber?: string;
  fname?: string;
  fcity?: string;
  fprovince?: string;
  fregion?: string;
  fmobile?: string;
  fcontacts?: string;
  faddress?: string;
  fsimplename?: string;
  fsocialcreditcode?: string;
  fregulatorname?: string;
  flongitude?: number;
  fdimension?: number;
  fenttype?: number; // 0餐饮 1学校 2加油站 3冷库 4社区
  fplatacc?: string;
  fthirdcomnum?: string;
}

export interface Camera {
  deviceId?: string;
  fname?: string;
  deviceHostIp?: string;
  status?: 'ON' | 'OFF' | 'on' | 'off';
  deviceSn?: string;
  updateTime?: string;
  fnationcode?: string;
  flv?: string;
  hls?: string;
  rtmp?: string;
  webrtc?: string;
  ws_flv?: string;
}

export interface AIRecord {
  id?: string;
  fsocialcreditcode?: string;
  type?: string;
  thumbnailBase64?: string;
  originalBase64?: string;
  fimgpath?: string;
  foriginimgpath?: string;
  createTime?: string;
  nvrsn?: string;
  deviceId?: string;
  equipId?: string;
  mp4Path?: string;
  channelId?: string;
  fnumber?: string;
}

