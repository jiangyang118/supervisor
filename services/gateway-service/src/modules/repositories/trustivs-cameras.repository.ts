import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type TrustivsCameraRow = {
  id?: number;
  schoolId?: number | null;
  canteenId?: number | null;
  api?: string | null;
  fnationcode: string;
  deviceSn?: string | null;
  deviceId?: string | null;
  name?: string | null;
  status?: string | null;
  flv?: string | null;
  hls?: string | null;
  rtmp?: string | null;
  webrtc?: string | null;
  wsFlv?: string | null;
  updateTime?: string | null;
  deviceHostIp?: string | null;
  thirdCompany?: string | null;
};

@Injectable()
export class TrustivsCamerasRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists trustivs_cameras (
           id int primary key auto_increment,
           school_id int null,
           canteen_id int null,
           api varchar(255) not null default '/gatewayGBS/openApi/getCameraByCompany',
           fnationcode varchar(128) not null,
           device_sn varchar(128) null,
           device_id varchar(128) null,
           name varchar(255) null,
           status varchar(16) null,
           flv varchar(1024) null,
           hls varchar(1024) null,
           rtmp varchar(1024) null,
           webrtc varchar(1024) null,
           ws_flv varchar(1024) null,
           update_time varchar(64) null,
           device_host_ip varchar(64) null,
           third_company varchar(128) null,
           created_at datetime not null default current_timestamp,
           updated_at datetime not null default current_timestamp on update current_timestamp,
           unique key uk_trustivs_cameras_fnationcode (fnationcode),
           key idx_trustivs_cameras_school (school_id),
           key idx_trustivs_cameras_canteen (canteen_id)
         )`
      );
      // Align columns if table pre-existed
      const { rows } = await this.db.query<any>(
        `select column_name as name from information_schema.columns where table_schema = database() and table_name = 'trustivs_cameras'`
      );
      const cols = new Set((rows || []).map((r: any) => (r.name || r.COLUMN_NAME || '').toString().toLowerCase()));
      const maybe = async (sql: string) => { try { await this.db.query(sql); } catch {} };
      if (!cols.has('api')) await maybe("alter table trustivs_cameras add column api varchar(255) not null default '/gatewayGBS/openApi/getCameraByCompany'");
      if (!cols.has('device_sn')) await maybe('alter table trustivs_cameras add column device_sn varchar(128) null');
      if (!cols.has('device_id')) await maybe('alter table trustivs_cameras add column device_id varchar(128) null');
      if (!cols.has('name')) await maybe('alter table trustivs_cameras add column name varchar(255) null');
      if (!cols.has('status')) await maybe('alter table trustivs_cameras add column status varchar(16) null');
      if (!cols.has('flv')) await maybe('alter table trustivs_cameras add column flv varchar(1024) null');
      if (!cols.has('hls')) await maybe('alter table trustivs_cameras add column hls varchar(1024) null');
      if (!cols.has('rtmp')) await maybe('alter table trustivs_cameras add column rtmp varchar(1024) null');
      if (!cols.has('webrtc')) await maybe('alter table trustivs_cameras add column webrtc varchar(1024) null');
      if (!cols.has('ws_flv')) await maybe('alter table trustivs_cameras add column ws_flv varchar(1024) null');
      if (!cols.has('update_time')) await maybe('alter table trustivs_cameras add column update_time varchar(64) null');
      if (!cols.has('device_host_ip')) await maybe('alter table trustivs_cameras add column device_host_ip varchar(64) null');
      if (!cols.has('third_company')) await maybe('alter table trustivs_cameras add column third_company varchar(128) null');
      if (!cols.has('school_id')) await maybe('alter table trustivs_cameras add column school_id int null');
      if (!cols.has('canteen_id')) await maybe('alter table trustivs_cameras add column canteen_id int null');
    } catch {}
  }

  private mapCamera(it: any, ctx?: { schoolId?: number | string; canteenId?: number | string; api?: string; third?: string }): TrustivsCameraRow | null {
    const fnationcode = String(it?.fnationcode || it?.code || '').trim();
    if (!fnationcode) return null;
    return {
      schoolId: ctx?.schoolId !== undefined ? Number(ctx.schoolId) : null,
      canteenId: ctx?.canteenId !== undefined ? Number(ctx.canteenId) : null,
      api: ctx?.api || '/gatewayGBS/openApi/getCameraByCompany',
      fnationcode,
      deviceSn: it?.deviceSn || it?.serial || null,
      deviceId: it?.deviceId || it?.fdeviceid || null,
      name: it?.fname || it?.name || null,
      status: it?.status || null,
      flv: it?.flv || null,
      hls: it?.hls || null,
      rtmp: it?.rtmp || null,
      webrtc: it?.webrtc || null,
      wsFlv: it?.ws_flv || it?.wsFlv || null,
      updateTime: it?.updateTime || null,
      deviceHostIp: it?.deviceHostIp || null,
      thirdCompany: ctx?.third || it?.fthirdcomnum || null,
    };
  }

  async upsertList(list: any[], ctx?: { schoolId?: number | string; canteenId?: number | string; api?: string; third?: string }) {
    if (!Array.isArray(list) || list.length === 0) return;
    for (const it of list) {
      const row = this.mapCamera(it, ctx);
      if (!row) continue;
      await this.upsert(row);
    }
  }

  async upsert(row: TrustivsCameraRow) {
    const sql =
      `insert into trustivs_cameras (
         school_id, canteen_id, api, fnationcode, device_sn, device_id, name, status, flv, hls, rtmp, webrtc, ws_flv, update_time, device_host_ip, third_company
       ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       on duplicate key update
         school_id = values(school_id),
         canteen_id = values(canteen_id),
         api = values(api),
         device_sn = values(device_sn),
         device_id = values(device_id),
         name = values(name),
         status = values(status),
         flv = values(flv),
         hls = values(hls),
         rtmp = values(rtmp),
         webrtc = values(webrtc),
         ws_flv = values(ws_flv),
         update_time = values(update_time),
         device_host_ip = values(device_host_ip),
         third_company = values(third_company)`;
    const args = [
      row.schoolId ?? null,
      row.canteenId ?? null,
      row.api ?? '/gatewayGBS/openApi/getCameraByCompany',
      row.fnationcode,
      row.deviceSn ?? null,
      row.deviceId ?? null,
      row.name ?? null,
      row.status ?? null,
      row.flv ?? null,
      row.hls ?? null,
      row.rtmp ?? null,
      row.webrtc ?? null,
      row.wsFlv ?? null,
      row.updateTime ?? null,
      row.deviceHostIp ?? null,
      row.thirdCompany ?? null,
    ];
    await this.db.query(sql, args);
  }
}

