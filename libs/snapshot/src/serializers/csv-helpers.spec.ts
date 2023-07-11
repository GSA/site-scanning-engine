import { truncateArray } from './csv-helpers';

describe('csv-helpers', () => {
  it('truncateArray truncates an array that would be greater than the character limit when serialized', () => {
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

    expect(result.join(',').length).toBeLessThanOrEqual(characterLimit);
  });

  it('truncateArray truncates does not truncate an array that would be less than the character limit when serialized', () => {
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
    expect(result.join(',').length).toBeLessThanOrEqual(characterLimit);
  });
});
