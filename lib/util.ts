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

// https://stackoverflow.com/a/53508547
export function mapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

export async function filterAsync<T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
}
