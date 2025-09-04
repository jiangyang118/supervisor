import { Module } from '@nestjs/common';
import { TrustivsUpstreamService } from './upstream.service';
import { TrustivsCacheService } from './cache.service';
import { TrustivsStreamService } from './service/stream.service';
import { TrustivsPlaybackService } from './service/playback.service';
import { TrustivsListService } from './service/list.service';
import { TrustivsAIService } from './service/ai.service';
import { TrustivsStreamController } from './controller/stream.controller';
import { TrustivsPlaybackController } from './controller/playback.controller';
import { TrustivsListController } from './controller/list.controller';
import { TrustivsAIController } from './controller/ai.controller';
import { TrustivsProxyController } from './controller/proxy.controller';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    TrustivsUpstreamService,
    TrustivsCacheService,
    TrustivsStreamService,
    TrustivsPlaybackService,
    TrustivsListService,
    TrustivsAIService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  controllers: [
    TrustivsStreamController,
    TrustivsPlaybackController,
    TrustivsListController,
    TrustivsAIController,
    TrustivsProxyController,
  ],
})
export class TrustivsModule {}
