import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  error(message: string, trace: string) {
    // add error reporting hook here
    super.error(message, trace);
  }
}
