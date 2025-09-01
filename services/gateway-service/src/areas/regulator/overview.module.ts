import { Module } from '@nestjs/common';
import { RegOverviewController } from '../../modules/reg-overview.controller';

@Module({
  controllers: [RegOverviewController],
})
export class RegulatorOverviewModule {}

