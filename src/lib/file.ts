import { stat } from 'fs/promises';
import { join } from 'path';

export const fileExists = (path: string) =>
  stat(join(process.cwd(), path)).then(
    () => true,
    () => false
  );

export const getSrcPath = () => {
  const srcRelativePath = process.env.BLOG_SRC_PATH;
  if (srcRelativePath === undefined) {
    throw new Error('BLOG_SRC_PATH 환경변수 없음');
  }
  const cwd = process.cwd();
  return join(cwd, srcRelativePath);
};

export const getFileSize = async (path: string) => (await stat(path)).size;
