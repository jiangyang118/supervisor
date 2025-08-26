import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HomeController } from './home.controller';
import { RegOverviewController } from './reg-overview.controller';
import { AIController } from './ai.controller';
import { BrightController } from './bright.controller';
import { ReportsController } from './reports.controller';
import { SchoolReportsController } from './school-reports.controller';

@Module({
  controllers: [
    HealthController,
    HomeController,
    RegOverviewController,
    AIController,
    BrightController,
    ReportsController,
    SchoolReportsController,
  ],
  providers: [],
})
export class AppModule {}
