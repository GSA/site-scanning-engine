import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  error(message: string, trace: string) {
    // add error reporting hook here
    super.error(message, trace);
  }
}
