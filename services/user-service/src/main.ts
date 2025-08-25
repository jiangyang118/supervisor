import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 3101;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`User Service listening on http://localhost:${port}`);
}

bootstrap();

