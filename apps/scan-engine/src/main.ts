import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  console.log("bootstrap()");
  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.init();
}
bootstrap();
