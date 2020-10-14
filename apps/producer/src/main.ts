import { NestFactory } from '@nestjs/core';
import { ProducerModule } from './producer.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(ProducerModule);
}
bootstrap();
