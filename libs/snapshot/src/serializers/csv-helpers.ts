export function truncateArray(
  arr: string[],
  toStringCharacterLimit: number,
): string[] {
  const result = [];
  let i = 0;

  while (
    JSON.stringify(result).length < toStringCharacterLimit &&
    i < arr.length
  ) {
    const temp = [...result];
    temp.push(arr[i]);
    if (JSON.stringify(temp).length < toStringCharacterLimit) {
      result.push(arr[i]);
    }
    i++;
  }

  return result;
}

export function formatValue(value: any, characterLimit = 2000): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const stripped = value.replace(/\r?\n|\r/g, '');
    return stripped.length > characterLimit
      ? stripped.substring(0, characterLimit)
      : stripped;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(truncateArray(value, characterLimit));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}
