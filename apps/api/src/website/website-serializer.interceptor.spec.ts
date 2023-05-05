import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';
import { mock } from 'jest-mock-extended';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { Website } from 'entities/website.entity';
import { Pagination } from 'nestjs-typeorm-paginate';

describe('WebsiteSerializerInterceptor', () => {
  let interceptor: WebsiteSerializerInterceptor;

  beforeEach(() => {
    interceptor = new WebsiteSerializerInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should intercept and serialize a website', async () => {
    const mockWebsite = new Website();

    const mockContext = mock<ExecutionContext>();
    const mockHandler = mock<CallHandler>({
      handle: () => of(mockWebsite),
    });

    const websiteObservable = interceptor.intercept(mockContext, mockHandler);
    const website = await lastValueFrom(websiteObservable);

    expect(website).toEqual(mockWebsite.serialized());
  });

  it('should intercept and serialize a paginated list of websites', async () => {
    const mockWebsite = new Website();
    const mockPagination = new Pagination([mockWebsite], {}, {});

    const mockContext = mock<ExecutionContext>();
    const mockHandler = mock<CallHandler>({
      handle: () => of(mockPagination),
    });

    const paginatedResultObservable = interceptor.intercept(
      mockContext,
      mockHandler,
    );
    const paginatedResult = await lastValueFrom(paginatedResultObservable);

    expect(paginatedResult).toEqual({
      items: [mockWebsite.serialized()],
      meta: {},
      links: {},
    });
  });
});
