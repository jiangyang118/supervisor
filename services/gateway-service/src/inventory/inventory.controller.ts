import { Controller, Get, Post, Patch, Body, Query, Sse, MessageEvent, Param } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InventoryService } from './inventory.service';

@Controller('school/inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  // Categories
  @Get('categories') listCategories(@Query('schoolId') schoolId?: string) {
    return this.svc.listCategories(schoolId);
  }
  @Post('categories') createCategory(@Body() b: { schoolId?: string; name: string }) {
    return this.svc.createCategory(b);
  }

  // Products (v2)
  @Get('products') listProductsV2(@Query('schoolId') schoolId?: string) {
    return this.svc.listProductsV2(schoolId);
  }
  @Post('products') createProductV2(@Body() b: { schoolId?: string; name: string; unit: string; category?: string; spec?: string; lastPrice?: number }) {
    return this.svc.createProductV2(b);
  }
  @Patch('products') updateProductV2(@Query('id') id: string, @Body() b: any) { return (this.svc as any).updateProductV2(id, b); }
  @Post('products/import/cloud') importCloudV2() { return this.svc.importFromCloudV2(); }
  @Post('products/import/template') importTemplateV2(@Body() b: { schoolId?: number | string; items: Array<{ name: string; unit: string; category?: string; spec?: string; lastPrice?: number }> }) {
    return this.svc.importFromTemplateV2(b.schoolId, b.items || []);
  }
  @Post('products/delete') deleteProductV2(@Body() b: { id: number }) { return (this.svc as any).deleteProductV2(b?.id); }

  // Suppliers
  @Get('suppliers') listSuppliers(
    @Query('schoolId') schoolId?: string,
    @Query('q') q?: string,
    @Query('enabled') enabled?: 'true' | 'false',
    @Query('expired') expired?: 'true' | 'false',
    @Query('expireStart') expireStart?: string,
    @Query('expireEnd') expireEnd?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.svc.listSuppliers({ schoolId, q, enabled, expired, expireStart, expireEnd, page, pageSize });
  }
  @Get('suppliers/detail') getSupplier(@Query('id') id: string) {
    return this.svc.getSupplier(id);
  }
  @Post('suppliers') createSupplier(
    @Body()
    b: {
      schoolId?: string;
      name: string;
      phone?: string;
      license?: string;
      address?: string;
      contact?: string;
      email?: string;
      enabled?: boolean;
    },
  ) {
    return this.svc.createSupplier(b);
  }
  @Patch('suppliers') updateSupplier(@Query('id') id: string, @Body() b: any) {
    return this.svc.updateSupplier(id, b);
  }
  @Post('suppliers/delete') deleteSupplier(@Body() b: { id: string }) {
    return this.svc.deleteSupplier(b.id);
  }
  @Post('suppliers/enable/batch') batchEnable(@Body() b: { ids: string[]; enabled: boolean }) {
    return this.svc.batchEnable(b.ids, b.enabled);
  }
  @Post('suppliers/:id/certificates') addCert(@Param('id') id: string, @Body() b: { type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string }) {
    return this.svc.addSupplierCertificate(id, b);
  }
  @Get('suppliers/summary') summary(@Query('id') id: string) {
    return this.svc.supplierSummary(id);
  }
  @Get('suppliers/export.csv')
  async exportCsv() {
    const { items } = await this.svc.listSuppliers({ page: 1, pageSize: 100000 });
    const headers = [
      'id',
      'name',
      'phone',
      'license',
      'address',
      'contact',
      'email',
      'enabled',
      'rating',
      'categories',
      'licenseExpireAt',
    ];
    const rows = (items as any[]).map((s: any) => [
      s.id,
      s.name,
      s.phone || '',
      s.license || '',
      s.address || '',
      s.contact || '',
      s.email || '',
      (s.enabled ?? true) ? '1' : '0',
      s.rating ?? '',
      Array.isArray(s.categories) ? s.categories.join('|') : '',
      s.licenseExpireAt || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
  @Post('suppliers/import') async importSuppliers(@Body() body: any) {
    // Accept either { items: [...] } JSON or raw CSV text string
    if (body && Array.isArray(body.items)) {
      const created = body.items.map((it: any) => this.svc.createSupplier(it));
      return { count: created.length };
    }
    if (typeof body === 'string') {
      const lines = body.split(/\r?\n/).filter((l: string) => l.trim());
      const [header, ...rest] = lines;
      const cols = header.split(',').map((s) => s.trim());
      let count = 0;
      for (const line of rest) {
        const vals = line
          .split(',')
          .map((s: string) => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
        const obj: any = {};
        cols.forEach((c: string, i: number) => (obj[c] = vals[i]));
        if (obj.enabled !== undefined) obj.enabled = obj.enabled === '1' || obj.enabled === 'true';
        if (obj.rating !== undefined && obj.rating !== '') obj.rating = Number(obj.rating);
        if (obj.categories) obj.categories = String(obj.categories).split('|').filter(Boolean);
        try {
          this.svc.createSupplier(obj);
          count++;
        } catch (e) {
          /* skip invalid */
        }
      }
      return { count };
    }
    return { count: 0 };
  }

  // Warehouses
  @Get('warehouses') listWarehouses(@Query('schoolId') schoolId?: string) {
    return this.svc.listWarehouses(schoolId);
  }
  @Post('warehouses') createWarehouse(
    @Body() b: { schoolId?: string; name: string; location?: string; capacity?: number },
  ) {
    return this.svc.createWarehouse(b);
  }
  @Patch('warehouses') updateWarehouse(
    @Query('id') id: string,
    @Body() b: { name?: string; location?: string; capacity?: number },
  ) {
    return this.svc.updateWarehouse(id, b);
  }
  @Post('warehouses/delete') deleteWarehouse(@Body() b: { id: string }) {
    return this.svc.deleteWarehouse(b.id);
  }

  // Inbound/Outbound
  @Get('inbound') listInbound(@Query('schoolId')  schoolId?: number) {
    return this.svc.listInbound(schoolId);
  }
  @Get('inbound/docs') listInboundDocs(@Query('schoolId') schoolId?: number) {
    return this.svc.listInboundDocs(schoolId);
  }
  @Post('inbound') createInbound(
    @Body()
    b: {
       schoolId?: number;
      productId: string;
      qty: number;
      supplierId?: string;
      warehouseId?: string;
      imageUrl?: string;
    },
  ) {
    return this.svc.createInbound(b);
  }
  @Post('inbound/doc') createInboundDoc(
    @Body()
    b: {
       schoolId?: number;
       canteenId?: number;
       supplierId?: number | string;
       date: string;
       operator?: string;
       items: Array<{ productId: string; qty: number; unitPrice?: number; prodDate?: string; shelfLifeDays?: number }>;
       tickets: Array<{ type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt'; imageUrl: string }>;
       images?: string[];
    },
  ) { return this.svc.createInboundDoc(b as any); }
  @Get('inbound/doc') inboundDocDetail(@Query('docNo') docNo: string) {
    return this.svc.getInboundDocDetail(docNo);
  }
  @Post('inbound/scale') scaleInbound(
    @Body()
    b: {
       schoolId?: number;
      productId: string;
      weight: number;
      supplierId?: string;
      warehouseId?: string;
      imageUrl?: string;
    },
  ) {
    return this.svc.scaleInbound(b);
  }

  @Get('outbound') listOutbound(@Query('schoolId')  schoolId?: number) {
    return this.svc.listOutbound(schoolId);
  }
  @Post('outbound') createOutbound(
    @Body()
    b: {
       schoolId?: number;
      productId: string;
      qty: number;
      purpose?: string;
      by?: string; // 出库人
      receiver?: string; // 领用人（可选）
      canteenId?: number; // 食堂
      date?: string; // 出库日期 YYYY-MM-DD
      warehouseId?: string;
    },
  ) {
    return this.svc.createOutbound(b);
  }
  @Post('outbound/scale') scaleOutbound(
    @Body()
    b: {
       schoolId?: number;
      productId: string;
      weight: number;
      purpose?: string;
      by?: string;
      receiver?: string;
      canteenId?: number;
      warehouseId?: string;
    },
  ) {
    return this.svc.scaleOutbound(b);
  }

  // Maintenance: clear outbound records (optionally by school)
  @Post('outbound/clear')
  clearOutbound(@Body() b: { schoolId?: number }) {
    return this.svc.clearOutbound(b?.schoolId);
  }

  // FIFO batches for outbound selection
  @Get('outbound/batches')
  outboundBatches(
    @Query('schoolId') schoolId?: string | number,
    @Query('productId') productId?: string | number,
    @Query('canteenId') canteenId?: string | number,
  ) {
    return this.svc.listOutboundBatches({ schoolId: Number(schoolId), productId: Number(productId), canteenId: canteenId !== undefined && canteenId !== null && String(canteenId).trim() !== '' ? Number(canteenId) : undefined });
  }

  // Stock
  @Get('stock') stock(@Query('schoolId')  schoolId?: number) {
    return this.svc.getStock(schoolId);
  }
  @Post('stock/stocktake') stocktake(@Body() b: {  schoolId?: number; productId: string; qty: number }) {
    return this.svc.stocktake(b);
  }
  @Get('stock/batches') stockBatches(
    @Query('schoolId') schoolId?: number | string,
    @Query('near') near?: 'true' | 'false',
  ) {
    return this.svc.listBatchStock({ schoolId: schoolId as any, near });
  }
  @Post('stock/stocktake-batch') stocktakeBatch(
    @Body() b: { schoolId?: number; inboundId: number; actualQty: number; operator?: string },
  ) {
    return this.svc.stocktakeBatch(b);
  }

  // Tickets
  @Get('tickets') listTickets(@Query('schoolId')  schoolId?: number) {
    return this.svc.listTickets(schoolId);
  }
  @Post('tickets') createTicket(@Body() b: {  schoolId?: number; productId: string; type: string; imageUrl?: string }) {
    return this.svc.createTicket(b);
  }

  // Additives
  @Get('additives') listAdditives(@Query('schoolId')  schoolId?: number) {
    return this.svc.listAdditives(schoolId);
  }
  @Post('additives') createAdditive(
    @Body() b: {  schoolId?: number; name: string; amount: number; dish?: string; by?: string },
  ) {
    return this.svc.createAdditive(b);
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
