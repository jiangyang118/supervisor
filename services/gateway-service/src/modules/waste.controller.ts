import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
import { WasteService, WasteCategory } from './waste.service';

@Controller('school/waste')
export class WasteController {
  constructor(private readonly svc: WasteService) {}

  // Categories
  @Get('categories')
  categories() {
    return this.svc.listCategories();
  }

  @Post('categories')
  createCategory(@Body() body: { name: string }) {
    return this.svc.createCategory(body.name);
  }

  @Patch('categories/:id/enable')
  setEnabled(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.svc.setCategoryEnabled(id, !!body.enabled);
  }

  @Delete('categories/:id')
  delete(@Param('id') id: string) {
    return this.svc.deleteCategory(id);
  }

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: WasteCategory,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({
      schoolId: schoolId !== undefined && schoolId !== null && schoolId !== '' ? Number(schoolId) : undefined,
      category,
      start,
      end,
      page,
      pageSize,
    });
  }

  @Post('records')
  create(
    @Body()
    body: {
      schoolId?: number;
      date?: string;
      category: WasteCategory;
      amount: number;
      buyer: string;
      person: string;
    },
  ) {
    return this.svc.create(body);
  }

  @Get('records/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getById(id);
  }
}
