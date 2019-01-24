import orgFs from 'fs';
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export function fixer<T>(
  _fs: typeof orgFs,
  _org: T,
  newFunc: Omit<T, '__promisify__'>
): T {
  return newFunc as T;
}
