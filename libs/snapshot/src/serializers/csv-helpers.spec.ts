import { truncateArray, formatValue } from './csv-helpers';

describe('csv-helpers', () => {
  describe('truncateArray', () => {
    it('truncates an array that would be greater than the character limit when serialized', () => {
    const longArray = [];
    const characterLimit = 5000;
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 500; i++) {
      let randomWord = '';
      for (let i = 0; i < 12; i++) {
        randomWord += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }

      longArray.push(randomWord);
    }

    const result = truncateArray(longArray, characterLimit);

    expect(JSON.stringify(result).length).toBeLessThanOrEqual(characterLimit);
  });

    it('does not truncate an array that would be less than the character limit when serialized', () => {
    const shortArray = [];
    const characterLimit = 5000;
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 10; i++) {
      let randomWord = '';
      for (let i = 0; i < 12; i++) {
        randomWord += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }

      shortArray.push(randomWord);
    }

    const result = truncateArray(shortArray, characterLimit);

    expect(result.length).toBe(shortArray.length);
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(characterLimit);
    });
  });

  describe('formatValue', () => {
    it('returns null for null input', () => {
      expect(formatValue(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(formatValue(undefined)).toBeNull();
    });

    it('strips newlines from strings', () => {
      expect(formatValue('line1\nline2')).toBe('line1line2');
      expect(formatValue('line1\rline2')).toBe('line1line2');
      expect(formatValue('line1\r\nline2')).toBe('line1line2');
    });

    it('truncates strings longer than character limit', () => {
      const longString = 'a'.repeat(3000);
      const result = formatValue(longString);

      expect(result).toBe('a'.repeat(2000));
      expect(result.length).toBe(2000);
    });

    it('does not truncate strings shorter than character limit', () => {
      const shortString = 'test string';
      expect(formatValue(shortString)).toBe('test string');
    });

    it('respects custom character limit', () => {
      const testString = 'a'.repeat(3000);
      const result = formatValue(testString, 500);

      expect(result.length).toBe(500);
    });

    it('JSON-stringifies arrays', () => {
      const arr = ['one', 'two', 'three'];
      const result = formatValue(arr);

      expect(result).toBe(JSON.stringify(arr));
      expect(typeof result).toBe('string');
    });

    it('truncates arrays when serialized length exceeds limit', () => {
      const longArray = [];
      const characterLimit = 1000;

      for (let i = 0; i < 200; i++) {
        longArray.push('verylongstringitem' + i);
      }

      const result = formatValue(longArray, characterLimit);
      const parsed = JSON.parse(result);

      expect(result.length).toBeLessThanOrEqual(characterLimit);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeLessThan(longArray.length);
    });

    it('converts Date objects to ISO strings', () => {
      const date = new Date('2026-07-31T12:00:00.000Z');
      const result = formatValue(date);

      expect(result).toBe('2026-07-31T12:00:00.000Z');
      expect(typeof result).toBe('string');
    });

    it('JSON-stringifies plain objects', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const result = formatValue(obj);

      expect(result).toBe(JSON.stringify(obj));
      expect(typeof result).toBe('string');
    });

    it('passes through numbers unchanged', () => {
      expect(formatValue(42)).toBe(42);
      expect(formatValue(3.14)).toBe(3.14);
      expect(formatValue(0)).toBe(0);
    });

    it('passes through booleans unchanged', () => {
      expect(formatValue(true)).toBe(true);
      expect(formatValue(false)).toBe(false);
    });

    it('handles empty strings', () => {
      expect(formatValue('')).toBe('');
    });

    it('handles empty arrays', () => {
      expect(formatValue([])).toBe('[]');
    });

    it('handles empty objects', () => {
      expect(formatValue({})).toBe('{}');
    });

    it('handles nested objects', () => {
      const nested = {
        level1: {
          level2: {
            value: 'deep'
          }
        }
      };

      expect(formatValue(nested)).toBe(JSON.stringify(nested));
    });

    it('handles mixed array content', () => {
      const mixed = [1, 'string', true, null, { key: 'value' }];
      const result = formatValue(mixed);

      expect(result).toBe(JSON.stringify(mixed));
    });
  });
});
