import { Controller, Get, Post, Patch, Body, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InventoryService } from './inventory.service';

@Controller('school/inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  // Categories
  @Get('categories') listCategories(){ return this.svc.listCategories(); }
  @Post('categories') createCategory(@Body() b: { name: string }){ return this.svc.createCategory(b); }

  // Products
  @Get('products') listProducts(){ return this.svc.listProducts(); }
  @Post('products') createProduct(@Body() b: { name: string; unit: string; categoryId?: string }){ return this.svc.createProduct(b); }
  @Post('products/import/cloud') importCloud(){ return this.svc.importFromCloud(); }
  @Post('products/import/template') importTemplate(@Body() b: { items: { name: string; unit: string; categoryId?: string }[] }){ return this.svc.importFromTemplate(b); }

  // Suppliers
  @Get('suppliers') listSuppliers(@Query('q') q?: string, @Query('enabled') enabled?: 'true'|'false', @Query('page') page = '1', @Query('pageSize') pageSize = '20'){
    return this.svc.listSuppliers({ q, enabled, page, pageSize });
  }
  @Get('suppliers/detail') getSupplier(@Query('id') id: string){ return this.svc.getSupplier(id); }
  @Post('suppliers') createSupplier(@Body() b: { name: string; phone?: string; license?: string; address?: string; contact?: string; email?: string; enabled?: boolean }){ return this.svc.createSupplier(b); }
  @Patch('suppliers') updateSupplier(@Query('id') id: string, @Body() b: any){ return this.svc.updateSupplier(id, b); }
  @Post('suppliers/delete') deleteSupplier(@Body() b: { id: string }){ return this.svc.deleteSupplier(b.id); }
  @Get('suppliers/export.csv') exportCsv(){
    const { items } = this.svc.listSuppliers({ page: 1, pageSize: 100000 });
    const headers = ['id','name','phone','license','address','contact','email','enabled','rating','categories','licenseExpireAt'];
    const rows = items.map((s:any)=>[
      s.id, s.name, s.phone||'', s.license||'', s.address||'', s.contact||'', s.email||'', (s.enabled??true) ? '1':'0', s.rating??'', Array.isArray(s.categories)?s.categories.join('|'):'', s.licenseExpireAt||''
    ]);
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    return { csv };
  }
  @Post('suppliers/import') async importSuppliers(@Body() body: any){
    // Accept either { items: [...] } JSON or raw CSV text string
    if (body && Array.isArray(body.items)){
      const created = body.items.map((it:any)=>this.svc.createSupplier(it));
      return { count: created.length };
    }
    if (typeof body === 'string'){
      const lines = body.split(/\r?\n/).filter((l:string)=>l.trim());
      const [header, ...rest] = lines;
      const cols = header.split(',').map(s=>s.trim());
      let count=0;
      for (const line of rest){
        const vals = line.split(',').map((s:string)=>s.replace(/^"|"$/g,'').replace(/""/g,'"'));
        const obj:any = {};
        cols.forEach((c:string,i:number)=>obj[c]=vals[i]);
        if (obj.enabled!==undefined) obj.enabled = obj.enabled === '1' || obj.enabled === 'true';
        if (obj.rating!==undefined && obj.rating!=='') obj.rating = Number(obj.rating);
        if (obj.categories) obj.categories = String(obj.categories).split('|').filter(Boolean);
        try{ this.svc.createSupplier(obj); count++; }catch(e){ /* skip invalid */ }
      }
      return { count };
    }
    return { count: 0 };
  }

  // Warehouses
  @Get('warehouses') listWarehouses(){ return this.svc.listWarehouses(); }
  @Post('warehouses') createWarehouse(@Body() b: { name: string; location?: string; capacity?: number }){ return this.svc.createWarehouse(b); }

  // Inbound/Outbound
  @Get('inbound') listInbound(){ return this.svc.listInbound(); }
  @Post('inbound') createInbound(@Body() b: { productId: string; qty: number; supplierId?: string; warehouseId?: string; imageUrl?: string }){ return this.svc.createInbound(b); }
  @Post('inbound/scale') scaleInbound(@Body() b: { productId: string; weight: number; supplierId?: string; warehouseId?: string; imageUrl?: string }){ return this.svc.scaleInbound(b); }

  @Get('outbound') listOutbound(){ return this.svc.listOutbound(); }
  @Post('outbound') createOutbound(@Body() b: { productId: string; qty: number; purpose?: string; by?: string; warehouseId?: string }){ return this.svc.createOutbound(b); }
  @Post('outbound/scale') scaleOutbound(@Body() b: { productId: string; weight: number; purpose?: string; by?: string; warehouseId?: string }){ return this.svc.scaleOutbound(b); }

  // Stock
  @Get('stock') stock(){ return this.svc.getStock(); }
  @Post('stock/stocktake') stocktake(@Body() b: { productId: string; qty: number }){ return this.svc.stocktake(b); }

  // Tickets
  @Get('tickets') listTickets(){ return this.svc.listTickets(); }
  @Post('tickets') createTicket(@Body() b: { productId: string; type: string; imageUrl?: string }){ return this.svc.createTicket(b); }

  // Additives
  @Get('additives') listAdditives(){ return this.svc.listAdditives(); }
  @Post('additives') createAdditive(@Body() b: { name: string; amount: number; dish?: string; by?: string }){ return this.svc.createAdditive(b); }

  @Sse('stream') stream(): Observable<MessageEvent> { return this.svc.stream(); }
}
