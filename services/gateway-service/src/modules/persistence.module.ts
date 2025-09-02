import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { RegulatorMorningChecksRepository } from './repositories/regulator-morning-checks.repository';
import { PublicFeedbackRepository } from './repositories/public-feedback.repository';
import { CertificatesRepository } from './repositories/certificates.repository';
import { FoodWasteRepository } from './repositories/food-waste.repository';
import { SchoolMorningChecksRepository } from './repositories/school-morning-checks.repository';
import { WasteRepository } from './repositories/waste.repository';

@Global()
@Module({
  providers: [
    DbService,
    MorningChecksRepository,
    RegulatorMorningChecksRepository,
    PublicFeedbackRepository,
    CertificatesRepository,
    FoodWasteRepository,
    SchoolMorningChecksRepository,
    WasteRepository,
  ],
  exports: [
    DbService,
    MorningChecksRepository,
    RegulatorMorningChecksRepository,
    PublicFeedbackRepository,
    CertificatesRepository,
    FoodWasteRepository,
    SchoolMorningChecksRepository,
    WasteRepository,
  ],
})
export class PersistenceModule {}
