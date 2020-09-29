import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ScanEngineController } from './scan-engine/scan-engine.controller';
import { ScanEngineModule } from './scan-engine/scan-engine.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scanEngineController = app
    .select(ScanEngineModule)
    .get(ScanEngineController);
  const result = await scanEngineController.runCoreScanner({
    url: 'https://18f.gov',
    agency: 'GSA',
    branch: 'Executive',
  });

  console.log('found final url');
  console.log(result.finalUrl);
}
bootstrap();
