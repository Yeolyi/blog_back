export const notEmpty = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const mapAdjacentElement = <T, U>(
  arr: readonly T[],
  f: (prev: T, next: T) => U
) => {
  return [...Array(arr.length - 1).keys()].map((idx) => {
    const left = arr[idx];
    const right = arr[idx + 1];
    return f(left, right);
  });
};
