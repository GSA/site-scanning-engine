import { Module } from '@nestjs/common';
import { BrowserFactoryProvider } from './browser.provider';
import { CoreScanner } from './core/core.scanner';

@Module({
  providers: [BrowserFactoryProvider, CoreScanner],
  exports: [CoreScanner, BrowserFactoryProvider],
})
export class ScannersModule {}
