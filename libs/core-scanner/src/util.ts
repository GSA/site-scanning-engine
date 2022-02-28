type UnwrapPromiseArray<T> = {
  [K in keyof T]: T[K] extends Promise<infer O> ? O : T[K];
};

// A type-safe Promise.all() alternative.
export function promiseAll<T extends ReadonlyArray<any>>(
  args: T,
): Promise<UnwrapPromiseArray<T>> {
  return Promise.all(args) as any;
}
