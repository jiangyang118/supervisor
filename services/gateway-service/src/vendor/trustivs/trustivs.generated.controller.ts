import { Controller, Req, Body, Headers, Query, Param, Get, Post, Put, Patch, Delete } from '@nestjs/common';
import { Request } from 'express';
import { TrustIVSGeneratedService } from './trustivs.generated.service';

@Controller('trustivs')
export class TrustIVSGeneratedController {
  private readonly svc = new TrustIVSGeneratedService();

  @Post('gatewayGBS/openApi/token/getOpenApiToken')
  async post_gatewayGBS_openApi_token_getOpenApiToken(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/token/getOpenApiToken` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_token_getOpenApiToken(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getCompanyList')
  async post_gatewayGBS_openApi_getCompanyList(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getCompanyList` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getCompanyList(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getCameraByCompany')
  async post_gatewayGBS_openApi_getCameraByCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getCameraByCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getCameraByCompany(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getAIRecordByCompany')
  async post_gatewayGBS_openApi_getAIRecordByCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getAIRecordByCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getAIRecordByCompany(q, body, headers)).data;
  }

  @Post('openApi/sendAIRecordByCompany')
  async post_openApi_sendAIRecordByCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/openApi/sendAIRecordByCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_openApi_sendAIRecordByCompany(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/getBackUrl')
  async get_gatewayGBS_openApi_getBackUrl(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getBackUrl` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_getBackUrl(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getDeviceStatus')
  async post_gatewayGBS_openApi_getDeviceStatus(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getDeviceStatus` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getDeviceStatus(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getChannelStatus')
  async post_gatewayGBS_openApi_getChannelStatus(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getChannelStatus` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getChannelStatus(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getDeviceStatusByCompany')
  async post_gatewayGBS_openApi_getDeviceStatusByCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getDeviceStatusByCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getDeviceStatusByCompany(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/getDownloadUrl')
  async get_gatewayGBS_openApi_getDownloadUrl(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getDownloadUrl` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_getDownloadUrl(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getStreamURL')
  async post_gatewayGBS_openApi_getStreamURL(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getStreamURL` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getStreamURL(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/getSnap')
  async get_gatewayGBS_openApi_getSnap(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getSnap` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_getSnap(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getDeviceListByCompany')
  async post_gatewayGBS_openApi_getDeviceListByCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getDeviceListByCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getDeviceListByCompany(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/getChannelByDevice')
  async post_gatewayGBS_openApi_getChannelByDevice(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/getChannelByDevice` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_getChannelByDevice(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/device/getConfig')
  async get_gatewayGBS_openApi_device_getConfig(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/device/getConfig` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_device_getConfig(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/facelib/add')
  async post_gatewayGBS_openApi_v1_facelib_add(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/add` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_facelib_add(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/facelib/update')
  async post_gatewayGBS_openApi_v1_facelib_update(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/update` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_facelib_update(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/facelib/delete')
  async get_gatewayGBS_openApi_v1_facelib_delete(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/delete` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_facelib_delete(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/facelib/enable')
  async get_gatewayGBS_openApi_v1_facelib_enable(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/enable` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_facelib_enable(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/facelib/disable')
  async get_gatewayGBS_openApi_v1_facelib_disable(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/disable` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_facelib_disable(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/facelib/get')
  async post_gatewayGBS_openApi_v1_facelib_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facelib/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_facelib_get(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/faceinfo/add')
  async post_gatewayGBS_openApi_v1_faceinfo_add(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/add` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_faceinfo_add(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/faceinfo/update')
  async post_gatewayGBS_openApi_v1_faceinfo_update(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/update` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_faceinfo_update(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/faceinfo/delete')
  async get_gatewayGBS_openApi_v1_faceinfo_delete(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/delete` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_faceinfo_delete(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/faceinfo/bind')
  async post_gatewayGBS_openApi_v1_faceinfo_bind(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/bind` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_faceinfo_bind(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/faceinfo/unbound')
  async post_gatewayGBS_openApi_v1_faceinfo_unbound(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/unbound` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_faceinfo_unbound(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/faceinfo/get')
  async post_gatewayGBS_openApi_v1_faceinfo_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/faceinfo/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_faceinfo_get(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/facerecord/get')
  async post_gatewayGBS_openApi_v1_facerecord_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/facerecord/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_facerecord_get(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autolib/add')
  async post_gatewayGBS_openApi_v1_autolib_add(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/add` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autolib_add(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autolib/update')
  async post_gatewayGBS_openApi_v1_autolib_update(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/update` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autolib_update(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/autolib/delete')
  async get_gatewayGBS_openApi_v1_autolib_delete(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/delete` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_autolib_delete(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/autolib/enable')
  async get_gatewayGBS_openApi_v1_autolib_enable(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/enable` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_autolib_enable(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/autolib/disable')
  async get_gatewayGBS_openApi_v1_autolib_disable(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/disable` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_autolib_disable(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autolib/get')
  async post_gatewayGBS_openApi_v1_autolib_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autolib/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autolib_get(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autoinfo/add')
  async post_gatewayGBS_openApi_v1_autoinfo_add(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/add` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autoinfo_add(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autoinfo/update')
  async post_gatewayGBS_openApi_v1_autoinfo_update(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/update` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autoinfo_update(q, body, headers)).data;
  }

  @Get('gatewayGBS/openApi/v1/autoinfo/delete')
  async get_gatewayGBS_openApi_v1_autoinfo_delete(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/delete` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.get_gatewayGBS_openApi_v1_autoinfo_delete(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autoinfo/bind')
  async post_gatewayGBS_openApi_v1_autoinfo_bind(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/bind` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autoinfo_bind(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autoinfo/unbound')
  async post_gatewayGBS_openApi_v1_autoinfo_unbound(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/unbound` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autoinfo_unbound(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autoinfo/get')
  async post_gatewayGBS_openApi_v1_autoinfo_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autoinfo/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autoinfo_get(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/v1/autorecord/get')
  async post_gatewayGBS_openApi_v1_autorecord_get(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/v1/autorecord/get` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_v1_autorecord_get(q, body, headers)).data;
  }

  @Post('openApi/sendHeartInfo')
  async post_openApi_sendHeartInfo(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/openApi/sendHeartInfo` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_openApi_sendHeartInfo(q, body, headers)).data;
  }

  @Post('openApi/sendChannel')
  async post_openApi_sendChannel(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/openApi/sendChannel` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_openApi_sendChannel(q, body, headers)).data;
  }

  @Post('openApi/sendHumRecord')
  async post_openApi_sendHumRecord(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/openApi/sendHumRecord` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_openApi_sendHumRecord(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/regulator/saveOrUpdateReagulator')
  async post_gatewayGBS_openApi_regulator_saveOrUpdateReagulator(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/regulator/saveOrUpdateReagulator` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_regulator_saveOrUpdateReagulator(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/regulator/updateReagulatorStatus')
  async post_gatewayGBS_openApi_regulator_updateReagulatorStatus(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/regulator/updateReagulatorStatus` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_regulator_updateReagulatorStatus(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/regulator/getRegulatorTree')
  async post_gatewayGBS_openApi_regulator_getRegulatorTree(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/regulator/getRegulatorTree` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_regulator_getRegulatorTree(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/company/saveOrUpdateCompany')
  async post_gatewayGBS_openApi_company_saveOrUpdateCompany(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/company/saveOrUpdateCompany` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_company_saveOrUpdateCompany(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/company/changeCompanyStatus')
  async post_gatewayGBS_openApi_company_changeCompanyStatus(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/company/changeCompanyStatus` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_company_changeCompanyStatus(q, body, headers)).data;
  }

  @Post('gatewayGBS/openApi/company/getCompanyBySocialCreditCode')
  async post_gatewayGBS_openApi_company_getCompanyBySocialCreditCode(@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {
    const path = `/gatewayGBS/openApi/company/getCompanyBySocialCreditCode` + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');
    return (await this.svc.post_gatewayGBS_openApi_company_getCompanyBySocialCreditCode(q, body, headers)).data;
  }
}