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
import { DineRepository } from './repositories/dine.repository';
import { DisinfectionRepository } from './repositories/disinfection.repository';
import { StaffRepository } from './repositories/staff.repository';
import { StaffCertsRepository } from './repositories/staff-certs.repository';
import { UsersRepository } from './repositories/users.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { PublicConfigRepository } from './repositories/public-config.repository';
import { CanteensRepository } from './repositories/canteens.repository';

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
    DineRepository,
    DisinfectionRepository,
    StaffRepository,
    StaffCertsRepository,
    UsersRepository,
    RolesRepository,
    PermissionsRepository,
    PublicConfigRepository,
    CanteensRepository,
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
    DineRepository,
    DisinfectionRepository,
    StaffRepository,
    StaffCertsRepository,
    UsersRepository,
    RolesRepository,
    PermissionsRepository,
    PublicConfigRepository,
    CanteensRepository,
  ],
})
export class PersistenceModule {}
