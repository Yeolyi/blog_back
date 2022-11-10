export const isAllowedFilePath = (filePath: string) => {
  return (
    !filePath.endsWith('package-lock.json') &&
    !filePath.endsWith('package.json') &&
    !filePath.includes('/build/')
  );
};
