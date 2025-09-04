import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('school/system')
export class SystemController {
  constructor(private readonly svc: SystemService) {}

  // Announcements
  @Get('announcements') listAnnouncements(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.svc.listAnnouncements({ page, pageSize });
  }
  @Post('announcements') createAnnouncement(@Body() b: { title: string; content: string }) {
    return this.svc.createAnnouncement(b);
  }
  @Get('announcements/detail') announcementDetail(@Query('id') id: string) {
    return this.svc.getAnnouncement(id);
  }
  @Post('announcements/attach') attach(@Body() b: { id: string; name: string; url: string }) {
    return this.svc.addAnnouncementAttachment(b.id, { name: b.name, url: b.url });
  }

  // Canteen
  @Get('canteen') canteen() {
    return this.svc.getCanteen();
  }
  @Post('canteen') saveCanteen(@Body() b: any) {
    return this.svc.saveCanteen(b);
  }

  // Linkage applications
  @Get('linkage') linkageList(@Query('status') status?: any) {
    return this.svc.listLinkage({ status });
  }
  @Post('linkage/apply') applyLinkage(
    @Body() b: { org: string; contact?: string; remark?: string },
  ) {
    return this.svc.applyLinkage(b);
  }
  @Patch('linkage/review') reviewLinkage(
    @Query('id') id: string,
    @Body() b: { status: any; comment?: string },
  ) {
    return this.svc.reviewLinkage(id, b.status as any, b.comment);
  }

  // Apps
  @Get('apps') apps() {
    return this.svc.listApps();
  }

  // Meals
  @Get('meals') meals() {
    return this.svc.listMeals();
  }
  @Post('meals') saveMeals(@Body() b: { items: any[] }) {
    return this.svc.saveMeals(b.items);
  }

  // Users & roles
  @Get('users') users() {
    return this.svc.listUsers();
  }
  @Get('roles') roles() {
    return this.svc.listRoles();
  }
  @Post('users/roles') setUserRoles(@Body() b: { id: string; roles: string[] }) {
    return this.svc.setUserRoles(b.id, b.roles);
  }
  @Get('permissions') permissions() {
    return this.svc.listPermissions();
  }
  @Post('roles/permissions') setRolePerms(@Body() b: { name: string; permissions: string[] }) {
    return this.svc.setRolePermissions(b.name, b.permissions);
  }

  // Staff (personnel)
  @Get('staff')
  staffList(
    @Query('schoolId') schoolId?: string,
    @Query('q') q?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.staffSearch({
      schoolId: schoolId ? Number(schoolId) : 1,
      q,
      page,
      pageSize,
    });
  }
  @Post('staff')
  staffCreate(
    @Body()
    b: { schoolId?: number; name: string; jobTitle?: string; phone?: string; healthCertNo?: string; enabled?: boolean },
  ) {
    return this.svc.staffCreate(b);
  }
  @Post('staff/import')
  staffImport(
    @Body()
    b: { schoolId?: number; items: Array<{ name: string; jobTitle?: string; phone?: string; healthCertNo?: string; enabled?: boolean }> },
  ) {
    return this.svc.staffImport(b.schoolId, b.items || []);
  }
  @Post('staff/update')
  staffUpdate(@Body() b: { id: number; patch: any }) {
    return this.svc.staffUpdate(b.id, b.patch || {});
  }
  @Post('staff/delete')
  staffDelete(@Body() b: { id: number }) {
    return this.svc.staffDelete(b.id);
  }

  // Platform news (for schools to read regulator-pushed infos)
  @Get('news') schoolNews(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('enabled') enabled: 'true' | 'false' = 'true',
  ) {
    return this.svc.listNews({ page, pageSize, enabled });
  }
  @Get('news/detail') schoolNewsDetail(@Query('id') id: string) {
    return this.svc.getNews(id);
  }
}
