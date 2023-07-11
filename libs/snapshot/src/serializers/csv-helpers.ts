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
    result.push(arr[i]);
    i++;
  }

  return result;
}
