import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Increase body size limits to support base64 image uploads
  const limitMb = Number(process.env.BODY_LIMIT_MB || process.env.UPLOAD_LIMIT_MB || 10);
  const limit = `${Math.max(1, limitMb)}mb`;
  app.use(json({ limit }));
  app.use(urlencoded({ limit, extended: true }));

  // Normalize legacy frontend prefixes: /api/school/* and /api/regulator/* → strip leading /api
  const http = app.getHttpAdapter().getInstance();
  http.use((req: any, _res: any, next: any) => {
    const url: string = req.url || '';
    if (url.startsWith('/api/school/') || url.startsWith('/api/regulator/')) {
      req.url = url.replace(/^\/api\//, '/');
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Food Safety API Gateway')
    .setDescription('OpenAPI for gateway routes')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 使用环境变量或默认端口3300
  const port = process.env.PORT ? Number(process.env.PORT) : 3300;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
}

bootstrap();
