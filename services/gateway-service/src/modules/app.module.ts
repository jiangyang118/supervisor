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
import { WasteController } from './waste.controller';
import { WasteService } from './waste.service';
import { CertificatesService } from './certificates.service';
// Public feedback & food-waste module removed
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
// Reg food-waste controller removed
import { DeviceController } from './device.controller';
import { InspectionsService } from './inspections.service';
import { RegInspectionsController } from './reg-inspections.controller';
import { RegAlertsController } from './reg-alerts.controller';
import { RegSystemController } from './reg-system.controller';
import { IntegrationController } from './integration.controller';
import { MorningCheckApiAdapterController } from './school-mc.adapter.controller';
import { DineApiAdapterController } from './school-dine.adapter.controller';
import { RegulatorMorningChecksController } from './regulator-morning-checks.controller';
import { RegulatorMorningChecksService } from './regulator-morning-checks.service';
import { RateLimitGuard } from './rate-limit.guard';
import { DeviceMockController } from './device-mock.controller';
import { DbService } from './db.service';
import { DbBootstrapService } from './db.bootstrap';
import { PersistenceModule } from './persistence.module';
import { DbHealthController } from './db.controller';
import { RoutesController } from './routes.controller';
import { Module as NestModule } from '@nestjs/common';
import { SchoolMorningCheckModule } from '../areas/school/morning-check.module';
import { SchoolDineModule } from '../areas/school/dine.module';
import { SchoolCanteensModule } from '../areas/school/canteens.module';
import { RegulatorOverviewModule } from '../areas/regulator/overview.module';
import { RegulatorLedgersModule } from '../areas/regulator/ledgers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { TrustivsModule } from './trustivs/trustivs.module';
import { AuthController } from './auth.controller';
import { IotController } from './iot.controller';
import { IotService } from './iot.service';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { TokenBlacklistService } from './token-blacklist.service';
import { SchoolCertificatesController } from './school-certificates.controller';
import { PersonnelController } from './personnel.controller';
import { PersonnelRepository } from './repositories/personnel.repository';
import { DeviceSafetyController } from './device-safety.controller';
import { DeviceSafetyService } from './device-safety.service';

@Module({
  imports: [
    PersistenceModule,
    // School-side feature modules
    SchoolMorningCheckModule,
    SchoolDineModule,
    SchoolCanteensModule,
    // Regulator-side feature modules
    RegulatorOverviewModule,
    RegulatorLedgersModule,
    // Domain modules
    InventoryModule,
    TrustivsModule,
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
    WasteController,
    PublicConfigController,
    SchoolCertificatesController,
    PersonnelController,
    DeviceSafetyController,
    EmergencyController,
    RiskController,
    AuthController,
    SystemController,
    AnalyticsController,
    DevicesController,
    FilesController,
    RegCredentialsController,
    RegInspectionsController,
    RegAlertsController,
    RegSystemController,
    DeviceController,
    IntegrationController,
    MorningCheckApiAdapterController,
    DineApiAdapterController,
    RegulatorMorningChecksController,
    DeviceMockController,
    DbHealthController,
    RoutesController,
    IotController,
  ],
  providers: [
    CredentialsService,
    SamplingService,
    PesticideService,
    DisinfectionService,
    HygieneService,
    
    WasteService,
    CertificatesService,
    
    PublicConfigService,
    EmergencyService,
    RiskService,
    SystemService,
    AnalyticsService,
    DevicesService,
    InspectionsService,
    RegulatorMorningChecksService,
    RateLimitGuard,
    DbBootstrapService,
    IotService,
    JwtGuard,
    PermissionGuard,
    TokenBlacklistService,
    PersonnelRepository,
    DeviceSafetyService,
  ],
})
export class AppModule {}
