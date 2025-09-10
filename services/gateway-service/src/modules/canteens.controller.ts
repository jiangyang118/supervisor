import { Body, Controller, Get, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { CanteensRepository } from './repositories/canteens.repository';
import { CanteenLicensesRepository } from './repositories/canteen-licenses.repository';
import { CertificatesRepository } from './repositories/certificates.repository';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';

@Controller('school')
@UseGuards(JwtGuard, PermissionGuard)
export class CanteensController {
  constructor(
    private readonly canteens: CanteensRepository,
    private readonly licenses: CanteenLicensesRepository,
    private readonly certs: CertificatesRepository,
  ) {}

  // Canteens CRUD
  @Get('canteens')
  async listCanteens(@Query('schoolId') schoolId?: string) {
    const sid = schoolId && String(schoolId).trim() !== '' ? Number(schoolId) : undefined;
    return this.canteens.list(sid) as any;
  }

  // Aggregated list for canteen + licenses summary (for list page)
  @Get('canteens/summary')
  async listCanteenSummary(@Query('schoolId') schoolId?: string) {
    const sid = schoolId && String(schoolId).trim() !== '' ? Number(schoolId) : undefined;
    const list = await this.canteens.list(sid);
    const lic = await this.licenses.list({ schoolId: sid });
    const byCanteen = new Map<number, any[]>();
    for (const l of lic) {
      const cid = Number((l as any).canteenId);
      if (!byCanteen.has(cid)) byCanteen.set(cid, []);
      byCanteen.get(cid)!.push(l);
    }
    const now = Date.now();
    const in30d = 30 * 24 * 3600 * 1000;
    const rows = (list || []).map((c: any) => {
      const cid = Number(c.id);
      const arr = byCanteen.get(cid) || [];
      const biz = arr.find((x: any) => x.type === '营业执照');
      const food = arr.find((x: any) => x.type === '食品经营许可证');
      const tBiz = biz?.expireAt ? Date.parse(biz.expireAt) : NaN;
      const tFood = food?.expireAt ? Date.parse(food.expireAt) : NaN;
      const tMin = [tBiz, tFood].filter((t) => Number.isFinite(t)).sort((a, b) => a - b)[0];
      let status: '有效' | '临期' | '过期' = '有效';
      if (Number.isFinite(tMin)) {
        if (tMin < now) status = '过期';
        else if (tMin - now <= in30d) status = '临期';
      }
      const expireAt = Number.isFinite(tMin) ? new Date(tMin).toISOString().slice(0, 10) : '';
      return {
        canteenId: cid,
        canteenName: c.name,
        address: c.address || '',
        manager: c.manager || '',
        phone: c.phone || '',
        bizLicenseNo: biz?.number || '',
        foodPermitNo: food?.number || '',
        expireAt,
        status,
      };
    });
    return rows;
  }

  @Post('canteens')
  async createCanteen(@Body() b: { schoolId?: number; name: string; address?: string; manager?: string; phone?: string }) {
    const sid = Number(b.schoolId ?? 1) || 1;
    if (!b?.name) throw new BadRequestException('name required');
    const id = await this.canteens.create({ schoolId: sid, name: b.name, address: b.address, licenseExpireAt: undefined, licenseNo: undefined, licenseImageUrl: undefined } as any);
    // update manager & phone if present
    const sets: string[] = []; const args: any[] = [];
    if (b.manager !== undefined) { sets.push('manager = ?'); args.push(b.manager); }
    if (b.phone !== undefined) { sets.push('phone = ?'); args.push(b.phone); }
    if (sets.length) { args.push(id); await (this.canteens as any).db.query(`update canteens set ${sets.join(', ')} where id = ?`, args); }
    return { id, schoolId: sid, name: b.name, address: b.address || '', manager: b.manager || '', phone: b.phone || '' } as any;
  }

  @Patch('canteens')
  async updateCanteen(@Query('id') id: string, @Body() patch: { name?: string; address?: string; manager?: string; phone?: string }) {
    if (!id) throw new BadRequestException('id required');
    const sets: string[] = []; const args: any[] = [];
    const map: Record<string, string> = { name: 'name', address: 'address', manager: 'manager', phone: 'phone' };
    for (const k of Object.keys(patch || {})) { const col = map[k]; if (col) { sets.push(`${col} = ?`); args.push((patch as any)[k]); } }
    if (!sets.length) return { ok: true } as any;
    args.push(Number(id));
    await (this.canteens as any).db.query(`update canteens set ${sets.join(', ')} where id = ?`, args);
    return { ok: true } as any;
  }

  @Post('canteens/delete')
  async deleteCanteen(@Body() b: { id: number }) {
    if (!b?.id) throw new BadRequestException('id required');
    await (this.canteens as any).db.query('delete from canteens where id = ?', [b.id]);
    return { ok: true } as any;
  }

  // Licenses CRUD
  @Get('canteen-licenses')
  async listLicenses(@Query('schoolId') schoolId?: string, @Query('canteenId') canteenId?: string) {
    const sid = schoolId && String(schoolId).trim() !== '' ? Number(schoolId) : undefined;
    const cid = canteenId && String(canteenId).trim() !== '' ? Number(canteenId) : undefined;
    const list = await this.licenses.list({ schoolId: sid, canteenId: cid });
    if ((list || []).length > 0 || !cid) return list;
    // Fallback: no rows in canteen_qualifications → synthesize from certificates by owner (canteen name)
    try {
      const canteens = await this.canteens.list(sid);
      const ct = canteens.find((c) => Number((c as any).id) === cid);
      if (!ct) return [];
      const owner = ct.name;
      const certs = await this.certs.list({ schoolId: sid as any, owner });
      return (certs || []).map((c: any) => ({
        id: 0,
        schoolId: sid || 0,
        canteenId: cid,
        type: c.type,
        number: c.number,
        authority: undefined,
        permitItems: undefined,
        expireAt: c.expireAt,
        imageUrl: undefined,
      }));
    } catch {
      return [];
    }
  }
  @Post('canteen-licenses')
  async createLicense(
    @Body() b: { canteenId: number; type: string; number?: string; authority?: string; permitItems?: string; expireAt?: string; imageUrl?: string },
  ) {
    const id = await this.licenses.insert({
      canteenId: Number(b.canteenId),
      type: b.type,
      number: b.number,
      authority: b.authority,
      permitItems: b.permitItems,
      expireAt: b.expireAt,
      imageUrl: b.imageUrl,
    });
    return { id } as any;
  }
  @Patch('canteen-licenses')
  async updateLicense(
    @Query('id') id: string,
    @Body() patch: Partial<{ number: string; authority: string; permitItems: string; expireAt: string; imageUrl: string; type: string }>,
  ) {
    await this.licenses.update(Number(id), patch);
    return { ok: true } as any;
  }
  @Post('canteen-licenses/delete')
  async deleteLicense(@Body() b: { id: number }) {
    await this.licenses.remove(Number(b.id));
    return { ok: true } as any;
  }

  // Unified detail endpoint
  @Get('canteen-detail')
  async canteenDetail(@Query('canteenId') canteenId?: string, @Query('schoolId') schoolId?: string) {
    const cid = canteenId && String(canteenId).trim() !== '' ? Number(canteenId) : undefined;
    if (!cid) return { canteen: null, licenses: { biz: null, food: null } };
    const sid = schoolId && String(schoolId).trim() !== '' ? Number(schoolId) : undefined;
    const list = await this.canteens.list(sid);
    const canteen = (list || []).find((c) => Number((c as any).id) === cid) || null;
    const lic = await this.licenses.list({ canteenId: cid });
    const biz = (lic || []).find((x: any) => x.type === '营业执照') || null;
    const food = (lic || []).find((x: any) => x.type === '食品经营许可证') || null;
    // fallback to certificates by owner name if missing
    let fbBiz = biz, fbFood = food;
    if (!biz || !food) {
      try {
        const { CertificatesRepository } = await import('./certificates.repository');
        const certRepo = (this as any).certRepo as InstanceType<typeof CertificatesRepository> | undefined;
        if (certRepo && canteen) {
          const certs = await certRepo.list({ schoolId: sid as any, owner: (canteen as any).name });
          if (!biz) fbBiz = (certs || []).find((x: any) => x.type === '营业执照') || null;
          if (!food) fbFood = (certs || []).find((x: any) => x.type === '食品经营许可证') || null;
        }
      } catch {}
    }
    return { canteen, licenses: { biz: fbBiz, food: fbFood } } as any;
  }

  @Patch('canteen-detail')
  async updateCanteenDetail(
    @Body()
    body: {
      canteenId: number;
      name?: string;
      address?: string;
      manager?: string;
      phone?: string;
      biz?: { id?: number; number: string; authority?: string; expireAt: string; imageUrl?: string };
      food?: { id?: number; number: string; authority?: string; permitItems?: string; expireAt: string; imageUrl?: string };
    },
  ) {
    const cid = Number(body?.canteenId);
    if (!Number.isFinite(cid) || cid <= 0) throw new BadRequestException('canteenId required');
    // update canteen basic
    const basic: any = {};
    if (body.name !== undefined) basic.name = body.name;
    if (body.address !== undefined) basic.address = body.address;
    if (body.manager !== undefined) basic.manager = body.manager;
    if (body.phone !== undefined) basic.phone = body.phone;
    if (Object.keys(basic).length) {
      const sets = Object.keys(basic).map((k) => `${k} = ?`).join(', ');
      const args = [...Object.values(basic), cid];
      await (this.canteens as any).db.query(`update canteens set ${sets} where id = ?`, args);
    }
    // upsert licenses
    const upsert = async (type: string, data?: any) => {
      if (!data) return;
      if (!data.number || !data.expireAt) throw new BadRequestException(`${type} number/expireAt required`);
      if (data.id) return this.licenses.update(Number(data.id), { number: data.number, authority: data.authority, permitItems: data.permitItems, expireAt: data.expireAt, imageUrl: data.imageUrl, type });
      return this.licenses.insert({ canteenId: cid, type, number: data.number, authority: data.authority, permitItems: data.permitItems, expireAt: data.expireAt, imageUrl: data.imageUrl });
    };
    await upsert('营业执照', body.biz);
    await upsert('食品经营许可证', body.food);

    // Sync to certificates (owner/type/number/expireAt) for backward compatibility
    try {
      // fetch schoolId and owner name
      const { rows } = await (this.canteens as any).db.query('select school_id as schoolId, name from canteens where id = ? limit 1', [cid]);
      const schoolId = Number(rows?.[0]?.schoolId || 0);
      const owner = String(rows?.[0]?.name || body.name || '');
      const syncOne = async (type: string, data?: any) => {
        if (!data || !data.number || !data.expireAt) return;
        // try find existing by owner+type
        const exist = await this.certs.list({ schoolId, owner, type });
        if ((exist || []).length) {
          for (const it of exist) {
            await this.certs.update(it.id, { number: data.number, expireAt: data.expireAt });
          }
        } else {
          await this.certs.insert({ schoolId, owner, type, number: data.number, expireAt: data.expireAt });
        }
      };
      await syncOne('营业执照', body.biz);
      await syncOne('食品经营许可证', body.food);
    } catch {}
    return { ok: true } as any;
  }

  @Post('canteen-detail/delete')
  async deleteCanteenDetail(@Body() b: { canteenId: number }) {
    const cid = Number(b?.canteenId);
    if (!Number.isFinite(cid) || cid <= 0) throw new BadRequestException('canteenId required');
    await (this.canteens as any).db.query('delete from canteen_qualifications where canteen_id = ?', [cid]);
    await (this.canteens as any).db.query('delete from canteens where id = ?', [cid]);
    return { ok: true } as any;
  }
}
