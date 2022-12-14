export const notEmpty = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

// https://stackoverflow.com/a/53508547
export const mapAsync = <T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> => {
  return Promise.all(array.map(callbackfn));
};

export const filterAsync = async <T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> => {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
};

export const replaceAsync = async (
  str: string,
  regex: RegExp,
  asyncFn: (str: string, p1: string) => Promise<string>
) => {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match, p1) => {
    const promise = asyncFn(match, p1);
    promises.push(promise);
    return '';
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift() ?? '');
};
