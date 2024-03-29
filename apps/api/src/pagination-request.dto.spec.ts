import { validate } from 'class-validator';
import { PaginationRequestDto } from './pagination-request.dto';
import { plainToClass } from 'class-transformer';

describe('PaginationRequestDto', () => {
  let paginationRequest: PaginationRequestDto;

  it('should be defined', () => {
    expect(new PaginationRequestDto()).toBeDefined();
  });

  beforeEach(() => {
    paginationRequest = new PaginationRequestDto();
  });

  it('should disallow negative values', async () => {
    paginationRequest.limit = -1;
    paginationRequest.page = -1;
    const validationErrors = await validate(paginationRequest);

    for (const err of validationErrors) {
      if (err.property === 'page') {
        expect(err.constraints).toHaveProperty('isPositive');
        expect(err.constraints).toHaveProperty('min');
      }

      if (err.property === 'limit') {
        expect(err.constraints).toHaveProperty('isPositive');
      }
    }
  });

  it('should disallow limit values over 100', async () => {
    paginationRequest.limit = 101;
    const validationErrors = await validate(paginationRequest);
    expect(validationErrors[0].constraints).toHaveProperty('max');
  });

  it('should allow valid values', async () => {
    paginationRequest.limit = 100;
    paginationRequest.page = 1;
    const validationErrors = await validate(paginationRequest);
    expect(validationErrors).toStrictEqual([]);
  });

  it('should transform string values to numbers', async () => {
    const plainPaginationRequest = {
      limit: '100',
      page: '1',
    };
    const classedPaginationRequest = plainToClass(
      PaginationRequestDto,
      plainPaginationRequest,
    );
    expect(typeof classedPaginationRequest.limit).toBe('number');
    expect(typeof classedPaginationRequest.page).toBe('number');
  });
});
