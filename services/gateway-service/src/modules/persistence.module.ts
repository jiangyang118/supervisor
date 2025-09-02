import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { RegulatorMorningChecksRepository } from './repositories/regulator-morning-checks.repository';
import { PublicFeedbackRepository } from './repositories/public-feedback.repository';
import { CertificatesRepository } from './repositories/certificates.repository';
import { FoodWasteRepository } from './repositories/food-waste.repository';
import { SchoolMorningChecksRepository } from './repositories/school-morning-checks.repository';
import { WasteRepository } from './repositories/waste.repository';
import { HygieneRepository } from './repositories/hygiene.repository';
import { PesticideRepository } from './repositories/pesticide.repository';
import { SchoolsRepository } from './repositories/schools.repository';
import { SamplingRepository } from './repositories/sampling.repository';

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
    HygieneRepository,
    PesticideRepository,
    SchoolsRepository,
    SamplingRepository,
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
    HygieneRepository,
    PesticideRepository,
    SchoolsRepository,
    SamplingRepository,
  ],
})
export class PersistenceModule {}
