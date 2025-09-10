import { Module } from '@nestjs/common';
import { CanteensController } from '../../modules/canteens.controller';

@Module({
  controllers: [CanteensController],
})
export class SchoolCanteensModule {}

