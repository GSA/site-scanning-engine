import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { Website } from 'entities/website.entity';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WebsiteSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result: Website | Website[]) => {
        if (result instanceof Website) {
          return this.serialize(result);
        } else if (result instanceof Array) {
          return result.map(website => {
            return this.serialize(website);
          });
        }
      }),
    );
  }

  private serialize(website: Website) {
    const serializedWebsite = classToPlain(website);
    const serializedCoreResult = classToPlain(website.coreResult);
    const serializedSolutionsResult = classToPlain(website.solutionsResult);

    return {
      ...serializedCoreResult,
      ...serializedSolutionsResult,
      ...serializedWebsite,
    };
  }
}
