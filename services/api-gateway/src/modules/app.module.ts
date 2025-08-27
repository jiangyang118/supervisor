import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HomeController } from './home.controller';
import { RegOverviewController } from './reg-overview.controller';
import { AIController } from './ai.controller';
import { BrightController } from './bright.controller';
import { ReportsController } from './reports.controller';
import { SchoolReportsController } from './school-reports.controller';
import { MorningCheckController } from './morning-check.controller';
import { MorningCheckService } from './morning-check.service';
import { SamplingController } from './sampling.controller';
import { SamplingService } from './sampling.service';
import { DineController } from './dine.controller';
import { DineService } from './dine.service';
import { PesticideController } from './pesticide.controller';
import { PesticideService } from './pesticide.service';
import { DisinfectionController } from './disinfection.controller';
import { DisinfectionService } from './disinfection.service';
import { HygieneController } from './hygiene.controller';
import { HygieneService } from './hygiene.service';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [
    HealthController,
    HomeController,
    RegOverviewController,
    AIController,
    BrightController,
    ReportsController,
    SchoolReportsController,
    MorningCheckController,
    SamplingController,
    DineController,
    PesticideController,
    DisinfectionController,
    HygieneController,
    InventoryController,
  ],
  providers: [
    MorningCheckService,
    SamplingService,
    DineService,
    PesticideService,
    DisinfectionService,
    HygieneService,
    InventoryService,
  ],
})
export class AppModule {}
