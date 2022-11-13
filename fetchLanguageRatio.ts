import { readFile, stat } from 'fs/promises';
import _ from 'lodash';
import { join } from 'path';
import {
  extractFileExtension,
  extToLanguageAndColor,
} from './data/extensionMap';
import { iteratePathTree, buildPathTree } from './lib/pathTree';
import { notEmpty } from './lib/util';

export interface Language {
  /**  프론트 호환 위함 */
  name: string;
  language: string;
  lines: number;
  percentage: number;
  color: string;
}

const fetchLanguageRatio = async (): Promise<Language[]> => {
  const fileTree = await buildPathTree(join(process.cwd(), '../../blog_src'));
  const markdownFilePaths: string[] = [];
  iteratePathTree(fileTree, async (node) => {
    if (node.path.endsWith('.md')) {
      markdownFilePaths.push(node.path);
    }
  });

  const result: { [ext: string]: number } = {};

  await Promise.all(
    markdownFilePaths.map(async (markdownFilePath) => {
      const content = await readFile(markdownFilePath, { encoding: 'utf-8' });
      const paths = [...content.matchAll(/!@([^@!]+)@!/g)]
        .map((x) => x[1])
        .map((x) => join(markdownFilePath, '../', x));
      const pathAndSizesPromise = paths.map(async (path) => ({
        ext: extractFileExtension(path),
        size: await getFileSize(path),
      }));
      const pathAndSizes = await Promise.all(pathAndSizesPromise);

      const notInlined = [
        ...content.matchAll(/```([a-z]+)\n([\S|\s]+?)(?=```)/g),
      ].map((x) => ({ ext: x[1], size: Buffer.byteLength(x[2], 'utf-8') }));

      for (const { ext, size } of pathAndSizes) {
        result[ext] = (result[ext] ?? 0) + size;
      }
      for (const { ext, size } of notInlined) {
        result[ext] = (result[ext] ?? 0) + size;
      }
    })
  );
  const temp = _(result)
    .mapValues((bytes, key) => {
      const languageAndColor = extToLanguageAndColor(key);
      if (languageAndColor === null) {
        return null;
      }
      return {
        ...languageAndColor,
        lines: bytes,
        name: languageAndColor.language,
      };
    })
    .filter(notEmpty)
    .filter((x) => isAllowedLanguage(x.language))
    .value();
  const largestProportion = Math.max(...temp.map((x) => x.lines));
  return _(temp)
    .map((x) => ({
      ...x,
      percentage: normalizeByLogScale(x.lines / largestProportion),
    }))
    .filter(minimumProportion)
    .value();
};

const getFileSize = async (path: string) => (await stat(path)).size;

const isAllowedLanguage = (languageName: string) => {
  return languageName !== 'Markdown';
};

const minimumProportion = (language: Language) => language.percentage > 0.01;

const normalizeByLogScale = (x: number) => {
  if (0 <= x && x <= 1) {
    return getBase2Log(x + 1);
  } else {
    throw new Error('Invalid number range');
  }
};

const getBase2Log = (x: number) => {
  return Math.log(x) / Math.log(2);
};

export default fetchLanguageRatio;
