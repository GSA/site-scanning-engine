import { NestFactory } from '@nestjs/core';
import { ProducerModule } from './producer.module';
import { TaskService } from './task/task.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ProducerModule);
  const taskService = app.get(TaskService);

  await taskService.start();
}
bootstrap();
