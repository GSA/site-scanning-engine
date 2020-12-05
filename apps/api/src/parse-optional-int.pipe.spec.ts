import { ParseOptionalIntPipe } from './parse-optional-int.pipe';

describe('ParseOptionalIntPipe', () => {
  let pipe: ParseOptionalIntPipe;

  beforeEach(() => {
    pipe = new ParseOptionalIntPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should do nothing for undefined values', () => {
    const result = pipe.transform(undefined, {
      type: 'query',
    });
    expect(result).toStrictEqual(undefined);
  });

  it('should parse number strings', () => {
    const result = pipe.transform('10', {
      type: 'query',
    });
    expect(result).toStrictEqual(10);
  });

  it('should throw a BadRequestException when value is NaN', () => {
    expect(() => {
      pipe.transform('abc', {
        type: 'query',
      });
    }).toThrow('Expected an integer value');
  });
});
