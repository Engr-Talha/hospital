import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT) || 3000;
  /** `0.0.0.0` = accept connections from other PCs on the LAN (this machine as server). */
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  Logger.log(
    `API listening on http://${host}:${port}/${globalPrefix} (other devices: use this PC's LAN IP instead of localhost)`,
  );
}

bootstrap();
