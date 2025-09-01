import { Body, Controller, Get, Post, Patch, Query } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('reg/system')
export class RegSystemController {
  constructor(private readonly svc: SystemService) {}

  // News (food safety infos)
  @Get('news') listNews(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('enabled') enabled?: 'true' | 'false',
  ) {
    return this.svc.listNews({ page, pageSize, enabled });
  }
  @Post('news') createNews(
    @Body() b: { title: string; content?: string; enabled?: boolean; pinned?: boolean },
  ) {
    return this.svc.createNews(b);
  }
  @Patch('news') updateNews(
    @Query('id') id: string,
    @Body() b: { title?: string; content?: string },
  ) {
    return this.svc.updateNews(id, b);
  }
  @Patch('news/enabled') setNewsEnabled(@Query('id') id: string, @Body() b: { enabled: boolean }) {
    return this.svc.updateNews(id, { enabled: !!b.enabled });
  }
  @Patch('news/pinned') setNewsPinned(@Query('id') id: string, @Body() b: { pinned: boolean }) {
    return this.svc.updateNews(id, { pinned: !!b.pinned });
  }
  @Post('news/delete') deleteNews(@Body() b: { id: string }) {
    return this.svc.deleteNews(b.id);
  }
  @Get('news/detail') newsDetail(@Query('id') id: string) {
    return this.svc.getNews(id);
  }

  // Linkage (association with other platforms)
  @Get('linkage') linkageList(@Query('status') status?: any) {
    return this.svc.listLinkage({ status });
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

  // Users & roles
  @Get('users') users() {
    return this.svc.listUsers();
  }
  @Post('users') createUser(
    @Body() b: { username: string; displayName: string; roles?: string[]; enabled?: boolean },
  ) {
    return this.svc.createUser(b);
  }
  @Patch('users') updateUser(@Query('id') id: string, @Body() b: any) {
    return this.svc.updateUser(id, b);
  }
  @Post('users/delete') deleteUser(@Body() b: { id: string }) {
    return this.svc.deleteUser(b.id);
  }
  @Get('roles') roles() {
    return this.svc.listRoles();
  }
  @Get('permissions') permissions() {
    return this.svc.listPermissions();
  }
  @Post('users/roles') setUserRoles(@Body() b: { id: string; roles: string[] }) {
    return this.svc.setUserRoles(b.id, b.roles);
  }
  @Post('roles/permissions') setRolePerms(@Body() b: { name: string; permissions: string[] }) {
    return this.svc.setRolePermissions(b.name, b.permissions);
  }

  // Regulator info
  @Get('info') info() {
    return this.svc.getRegulator();
  }
  @Post('info') saveInfo(@Body() b: any) {
    return this.svc.saveRegulator(b);
  }
}
