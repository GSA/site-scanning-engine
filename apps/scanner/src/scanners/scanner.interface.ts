/**
 * Scanner is a generic interface for defining a scanner.
 *
 */
export interface Scanner<Input, Result> {
  scan(i: Input): Promise<Result>;
}
