import { Module } from '@nestjs/common';
import { MorningCheckController } from '../../modules/morning-check.controller';
import { MorningCheckService } from '../../modules/morning-check.service';

@Module({
  controllers: [MorningCheckController],
  providers: [MorningCheckService],
})
export class SchoolMorningCheckModule {}

