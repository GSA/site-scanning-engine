import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle('Site Scanning API')
    .setDescription(
      'Site Scanning API provides information about sites in the federal web presence.',
    )
    .setVersion('2.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
