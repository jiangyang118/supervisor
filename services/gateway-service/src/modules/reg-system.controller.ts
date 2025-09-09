import { Body, Controller, Get, Post, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { SystemService } from './system.service';
import { RolesRepository } from './repositories/roles.repository';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';
import type { Request } from 'express';

@Controller('reg/system')
@UseGuards(JwtGuard, PermissionGuard)
export class RegSystemController {
  constructor(private readonly svc: SystemService, private readonly rolesRepo: RolesRepository) {}

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
  @Get('users') users(@Req() req: Request) {
    const current = (req as any)?.user as { username?: string; roles?: string[] } | undefined;
    const isSuper = !!current?.roles?.includes('PLATFORM_SUPER') || current?.username === 'super';
    return this.svc.listUsers().then((rows) => (isSuper ? rows : rows.filter((u: any) => u.username !== 'super')));
  }
  @Post('users')
  @Perm('users.manage')
  createUser(
    @Body() b: { username: string; displayName: string; roles?: string[]; enabled?: boolean },
  ) {
    return this.svc.createUser(b);
  }

  // Create school-side account and bind to a school
  @Post('school-accounts')
  @Perm('users.manage')
  createSchoolAccount(
    @Body()
    b: { schoolId: number; username: string; displayName?: string; phone?: string; password?: string; roles?: string[] },
  ) {
    return this.svc.createSchoolAccount({
      schoolId: Number(b.schoolId),
      username: b.username,
      displayName: b.displayName,
      phone: b.phone,
      password: b.password,
      roles: b.roles,
    });
  }

  // Aliases with singular path for compatibility
  @Post('school-account')
  @Perm('users.manage')
  createSchoolAccountAlias(
    @Body()
    b: { schoolId: number; username: string; displayName?: string; phone?: string; password?: string; roles?: string[] },
  ) {
    return this.createSchoolAccount(b);
  }

  @Get('school-accounts')
  @Perm('users.manage')
  listSchoolAccounts(@Query('schoolId') schoolId?: string, @Query('q') q?: string) {
    return this.svc.listSchoolAccounts({ schoolId: schoolId ? Number(schoolId) : undefined, q });
  }

  @Get('school-account')
  @Perm('users.manage')
  listSchoolAccountsAlias(@Query('schoolId') schoolId?: string, @Query('q') q?: string) {
    return this.listSchoolAccounts(schoolId, q);
  }

  @Patch('school-accounts/:id')
  @Perm('users.manage')
  updateSchoolAccount(@Query('id') idQuery: string, @Body() b: any) {
    const id = Number(idQuery || b?.id);
    return this.svc.updateSchoolAccount(id, { displayName: b?.displayName, phone: b?.phone, enabled: b?.enabled, roles: b?.roles, schoolId: b?.schoolId });
  }

  @Patch('school-account/:id')
  @Perm('users.manage')
  updateSchoolAccountAlias(@Query('id') idQuery: string, @Body() b: any) {
    return this.updateSchoolAccount(idQuery, b);
  }

  @Post('school-accounts/:id/delete')
  @Perm('users.manage')
  deleteSchoolAccount(@Query('id') idQuery: string, @Body() b: any, @Req() req: Request) {
    const id = Number(idQuery || b?.id);
    const u: any = (req as any)?.user || {};
    return this.svc.deleteSchoolAccount(id, { id: u?.sub, username: u?.username });
  }

  @Post('school-account/:id/delete')
  @Perm('users.manage')
  deleteSchoolAccountAlias(@Query('id') idQuery: string, @Body() b: any, @Req() req: Request) {
    return this.deleteSchoolAccount(idQuery, b, req);
  }
  @Patch('users')
  @Perm('users.manage')
  updateUser(@Query('id') id: string, @Body() b: any) {
    return this.svc.updateUser(Number(id), b);
  }
  @Post('users/delete')
  @Perm('users.manage')
  deleteUser(@Body() b: { id: string }, @Req() req: Request) {
    const u: any = (req as any)?.user || {};
    return this.svc.deleteUser(Number(b.id), { id: u?.sub, username: u?.username });
  }
  @Get('roles') roles() {
    return this.svc.listRoles();
  }
  @Post('roles')
  @Perm('users.manage')
  createRole(@Body() b: { name: string; remark?: string }) {
    if (!b?.name) return { ok: false, message: 'name required' } as any;
    // regulator roles are global (no schoolId linkage)
    return this.rolesRepo.create(1, b.name, b.remark);
  }
  @Patch('roles')
  @Perm('users.manage')
  updateRole(@Body() b: { id: number; patch: { name?: string; remark?: string } }) {
    if (!b?.id) return { ok: false, message: 'id required' } as any;
    return this.rolesRepo.update(Number(b.id), b.patch || {});
  }
  @Post('roles/delete')
  @Perm('users.manage')
  deleteRole(@Body() b: { id: number }) {
    if (!b?.id) return { ok: false, message: 'id required' } as any;
    return this.rolesRepo.remove(Number(b.id));
  }
  @Get('permissions') permissions() {
    return this.svc.listPermissions();
  }
  @Post('users/roles')
  @Perm('users.manage')
  setUserRoles(@Body() b: { id: string; roles: string[] }) {
    return this.svc.setUserRoles(b.id, b.roles);
  }
  @Post('roles/permissions')
  @Perm('users.manage')
  setRolePerms(@Body() b: { name: string; permissions: string[] }) {
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
