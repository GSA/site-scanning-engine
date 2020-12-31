import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
  constructor(private errorMessage?: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        if (data == undefined) {
          throw new NotFoundException(this.errorMessage);
        }
      }),
    );
  }
}
