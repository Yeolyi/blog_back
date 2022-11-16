import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';

export const fileExists = (path: string) =>
  stat(join(process.cwd(), path)).then(
    () => true,
    () => false
  );

export const makeDirAndWriteFile = async (dir: string, file: string) => {
  await mkdir(dir, { recursive: true });

  const jsonFilePath = join(dir, 'index.json');
  writeFile(jsonFilePath, file);
};

export const getSrcPath = () => {
  const srcRelativePath = process.env.BLOG_SRC_PATH;
  if (srcRelativePath === undefined) {
    throw new Error('BLOG_SRC_PATH 환경변수 없음');
  }
  const cwd = process.cwd();
  return join(cwd, srcRelativePath);
};

export const getFileSize = async (path: string) => (await stat(path)).size;
