import { Module } from '@nestjs/common';
import { RegLedgersController } from '../../modules/reg-ledgers.controller';

@Module({
  controllers: [RegLedgersController],
})
export class RegulatorLedgersModule {}

