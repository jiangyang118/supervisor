import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HomeController } from './home.controller';

@Module({
  imports: [],
  controllers: [HealthController, HomeController],
  providers: [],
})
export class AppModule {}
