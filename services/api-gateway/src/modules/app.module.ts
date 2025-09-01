import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HomeController } from './home.controller';
import { AIController } from './ai.controller';
import { BrightController } from './bright.controller';
import { ReportsController } from './reports.controller';
import { SchoolReportsController } from './school-reports.controller';
import { SamplingController } from './sampling.controller';
import { SamplingService } from './sampling.service';
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
import { WasteController } from './waste.controller';
import { WasteService } from './waste.service';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { FoodWasteController } from './food-waste.controller';
import { FoodWasteService } from './food-waste.service';
import { PublicFeedbackController } from './public-feedback.controller';
import { PublicFeedbackService } from './public-feedback.service';
import { RegPublicFeedbackController } from './reg-public-feedback.controller';
import { PublicConfigController } from './public-config.controller';
import { PublicConfigService } from './public-config.service';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DevicesController } from './devices.controller';
import { FilesController } from './files.controller';
import { DevicesService } from './devices.service';
import { RegCredentialsController } from './reg-credentials.controller';
import { RegFoodWasteController } from './reg-food-waste.controller';
import { DeviceController } from './device.controller';
import { SchoolInspectionsController } from './school-inspections.controller';
import { InspectionsService } from './inspections.service';
import { RegInspectionsController } from './reg-inspections.controller';
import { RegAlertsController } from './reg-alerts.controller';
import { RegSystemController } from './reg-system.controller';
import { IntegrationController } from './integration.controller';
import { MorningCheckApiAdapterController } from './school-mc.adapter.controller';
import { DineApiAdapterController } from './school-dine.adapter.controller';
import { Module as NestModule } from '@nestjs/common';
import { SchoolMorningCheckModule } from '../areas/school/morning-check.module';
import { SchoolDineModule } from '../areas/school/dine.module';
import { RegulatorOverviewModule } from '../areas/regulator/overview.module';
import { RegulatorLedgersModule } from '../areas/regulator/ledgers.module';

@Module({
  imports: [
    // School-side feature modules
    SchoolMorningCheckModule,
    SchoolDineModule,
    // Regulator-side feature modules
    RegulatorOverviewModule,
    RegulatorLedgersModule,
  ],
  controllers: [
    HealthController,
    HomeController,
    
    AIController,
    BrightController,
    ReportsController,
    SchoolReportsController,
    SamplingController,
    PesticideController,
    DisinfectionController,
    HygieneController,
    InventoryController,
    WasteController,
    CertificatesController,
    TrainingController,
    FoodWasteController,
    PublicFeedbackController,
    RegPublicFeedbackController,
    PublicConfigController,
    EmergencyController,
    RiskController,
    SystemController,
    AnalyticsController,
    DevicesController,
    FilesController,
    RegCredentialsController,
    RegFoodWasteController,
    RegInspectionsController,
    RegAlertsController,
    SchoolInspectionsController,
    RegSystemController,
    DeviceController,
    IntegrationController,
    MorningCheckApiAdapterController,
    DineApiAdapterController,
  ],
  providers: [
    CredentialsService,
    SamplingService,
    PesticideService,
    DisinfectionService,
    HygieneService,
    InventoryService,
    WasteService,
    CertificatesService,
    TrainingService,
    FoodWasteService,
    PublicFeedbackService,
    PublicConfigService,
    EmergencyService,
    RiskService,
    SystemService,
    AnalyticsService,
    DevicesService,
    InspectionsService,
  ],
})
export class AppModule {}
