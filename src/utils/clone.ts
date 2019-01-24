export function clone<T extends any>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  let copy: any;
  if (obj instanceof Object) {
    copy = { __proto__: obj.__proto__ };
  } else {
    copy = Object.create(null);
  }
  Object.getOwnPropertyNames(obj).forEach((key) => {
    const propValue = Object.getOwnPropertyDescriptor(obj, key);
    if (typeof propValue !== 'undefined') {
      Object.defineProperty(copy, key, propValue);
    }
  });
  return copy;
}
