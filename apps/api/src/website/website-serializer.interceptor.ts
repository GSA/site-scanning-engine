import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Website } from 'entities/website.entity';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WebsiteSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result: Website | Pagination<Website>) => {
        if (result instanceof Website) {
          return result.serialized();
        } else {
          const serializedItems = result.items.map((website) => {
            const serialized = website.serialized();
            return serialized;
          });

          const apiResult = new Pagination(
            serializedItems,
            result.meta,
            result.links,
          );

          return apiResult;
        }
      }),
    );
  }
}
