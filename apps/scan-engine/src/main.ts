import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger:
      process.env.NODE_ENV === 'dev'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['error', 'warn'],
  });
  app.init();
}
bootstrap();
