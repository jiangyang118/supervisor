import { Module } from '@nestjs/common';
import { RegLedgersController } from '../../modules/reg-ledgers.controller';
import { SchoolDineModule } from '../school/dine.module';
import { SamplingService } from '../../modules/sampling.service';
import { DisinfectionService } from '../../modules/disinfection.service';
import { WasteService } from '../../modules/waste.service';
import { TrainingService } from '../../modules/training.service';

@Module({
  imports: [
    SchoolDineModule, // provides DineService
  ],
  controllers: [RegLedgersController],
  providers: [
    SamplingService,
    DisinfectionService,
    WasteService,
    TrainingService,
  ],
})
export class RegulatorLedgersModule {}
