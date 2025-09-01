import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegulatorMorningChecksService } from './regulator-morning-checks.service';
import { ApiBody, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RegulatorIngestApiKeyGuard } from './regulator-ingest.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';

// Maintain compatibility with legacy path used by device-mock:
// external calls to /api/regulator/morning-checks/* are normalized in main.ts
// to /regulator/morning-checks/*, which matches this controller prefix.
@ApiTags('Regulator')
@ApiHeader({ name: 'x-api-key', required: false, description: 'Required if INGEST_API_KEY is set' })
@UseGuards(RegulatorIngestApiKeyGuard, RateLimitGuard)
@Controller('regulator/morning-checks')
export class RegulatorMorningChecksController {
  constructor(private readonly svc: RegulatorMorningChecksService) {}

  @Get()
  @ApiOkResponse({ description: 'List received morning checks' })
  list() {
    return { data: this.svc.list() };
  }

  @Post('push')
  @ApiBody({ description: 'Push a morning-check payload from school/ingestion', schema: { type: 'object' } })
  @ApiOkResponse({ description: 'Accepted with generated id' })
  push(@Body(new ZodValidationPipe(z.object({ schoolId: z.string().optional(), schoolName: z.string().optional() }).passthrough())) body: any) {
    return this.svc.push(body);
  }
}
