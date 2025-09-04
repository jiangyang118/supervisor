import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TransformResponseInterceptor } from './transform-response.interceptor';
import { ApiKeyGuard } from './api-key.guard';
import { TrustivsProxyController } from './controller/proxy.controller';
import { HeaderValidationInterceptor } from './header-validation.interceptor';
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

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TransformResponseInterceptor } from './transform-response.interceptor';
import { ApiKeyGuard } from './api-key.guard';
import { TrustivsProxyController } from './controller/proxy.controller';
import { HeaderValidationInterceptor } from './header-validation.interceptor';
import { TrustivsUpstreamService } from './upstream.service';
import { TrustivsCacheService } from './cache.service';

@Module({
  providers: [
    TrustivsUpstreamService,
    TrustivsCacheService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: HeaderValidationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
  controllers: [TrustivsStreamController, TrustivsPlaybackController, TrustivsListController, TrustivsAIController, TrustivsProxyController],
  providers: [
    TrustivsUpstreamService,
    TrustivsCacheService,
    TrustivsStreamService,
    TrustivsPlaybackService,
    TrustivsListService,
    TrustivsAIService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: HeaderValidationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class TrustivsModule {}

