import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { upsertDevice } from './integration.store';
import { DeviceSignGuard } from './device-sign.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';

// Lightweight endpoint to accept device heartbeat from mock devices
// Compatible with device-mock: POST /device/morningChecker/heartBeatInfo (x-www-form-urlencoded)
@ApiTags('Device')
@ApiHeader({ name: 'x-sign', required: false, description: 'Signature header (optional if sign is provided in body)' })
@UseGuards(DeviceSignGuard, RateLimitGuard)
@Controller('device/morningChecker')
export class DeviceMockController {
  @Post('heartBeatInfo')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ schema: { type: 'object', properties: { equipmentCode: { type: 'string' }, sign: { type: 'string' } }, required: ['equipmentCode'] } })
  @ApiOkResponse({ description: 'Heartbeat accepted' })
  heartBeat(@Body() body: any) {
    const equipmentCode = String(body?.equipmentCode || body?.machineCode || '').trim();
    if (equipmentCode) {
      upsertDevice({ equipmentCode, onlineStatus: 'online', lastHeartbeatAt: new Date().toISOString() });
    }
    // Return plain text is fine; device-mock reads text. JSON also acceptable.
    return 'OK';
  }
}
