import { NotFoundInterceptor } from './not-found.interceptor';
import {
  ExecutionContext,
  CallHandler,
  NotFoundException,
} from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { of, lastValueFrom } from 'rxjs';

describe('NotFoundInterceptor', () => {
  let interceptor: NotFoundInterceptor;

  beforeEach(() => {
    interceptor = new NotFoundInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should intercept and throw a not found exception', () => {
    const mockContext = mock<ExecutionContext>();
    const mockHandler = mock<CallHandler>({
      handle: () => of(undefined),
    });

    const notFoundObservable = interceptor.intercept(mockContext, mockHandler);
    expect(lastValueFrom(notFoundObservable)).rejects.toThrow(
      NotFoundException,
    );
  });
});
