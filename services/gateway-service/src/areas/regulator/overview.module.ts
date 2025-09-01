import { Module } from '@nestjs/common';
import { RegOverviewController } from '../../modules/reg-overview.controller';
import { SchoolMorningCheckModule } from '../school/morning-check.module';
import { SchoolDineModule } from '../school/dine.module';
import { SamplingService } from '../../modules/sampling.service';
import { DisinfectionService } from '../../modules/disinfection.service';
import { WasteService } from '../../modules/waste.service';
import { DevicesService } from '../../modules/devices.service';
import { PublicFeedbackService } from '../../modules/public-feedback.service';

@Module({
  imports: [
    // Import feature modules that provide needed services
    SchoolMorningCheckModule, // provides MorningCheckService
    SchoolDineModule, // provides DineService
  ],
  controllers: [RegOverviewController],
  providers: [
    // Local providers used by the controller
    SamplingService,
    DisinfectionService,
    WasteService,
    DevicesService,
    PublicFeedbackService,
  ],
})
export class RegulatorOverviewModule {}
