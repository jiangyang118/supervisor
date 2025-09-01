import { Module } from '@nestjs/common';
import { DineController } from '../../modules/dine.controller';
import { DineService } from '../../modules/dine.service';

@Module({
  controllers: [DineController],
  providers: [DineService],
})
export class SchoolDineModule {}

