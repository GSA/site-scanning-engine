import { NestFactory } from '@nestjs/core';
import { ProducerModule } from './producer.module';
import { TaskService } from './task/task.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ProducerModule, {
    logger:
      process.env.NODE_ENV === 'dev'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['error', 'warn'],
  });
  const taskService = app.get(TaskService);

  await taskService.start();
}
bootstrap();
