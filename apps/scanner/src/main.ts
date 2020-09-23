import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HeadlessController } from './headless/headless.controller';
import { HeadlessModule } from './headless/headless.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const headlessController = app.select(HeadlessModule).get(HeadlessController);
  const result = await headlessController.start();
  console.log(result.toJSON());
}
bootstrap();
