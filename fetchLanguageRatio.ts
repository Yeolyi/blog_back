import _ from 'lodash';
import { extractFileExtension, extToLanguageAndColor } from './extensionMap';
import { getAllCommits } from './git';
import { isAllowedFilePath } from './lib/isAllowedFilePath';
import { notEmpty } from './lib/util';

export interface Language {
  // 프론트 호환 위함
  name: string;
  language: string;
  lines: number;
  percentage: number;
  color: string;
}

const fetchLanguageRatio = async (): Promise<Language[]> => {
  const commits = await getAllCommits('../blog_src');
  const langaugeAndColor = _(commits)
    .flatMap((x) => x.files)
    .filter((x) => isAllowedFilePath(x.filePath))
    .groupBy((file) => extractFileExtension(file.filePath))
    .mapValues((files, ext) => {
      const languageAndColor = extToLanguageAndColor(ext);
      if (languageAndColor === null) {
        return null;
      }
      const lines = files.reduce(
        (prev, cur) => prev + cur.addedLinesCnt + cur.deletedLinesCnt,
        0
      );
      return {
        ...languageAndColor,
        lines,
      };
    })
    .filter(notEmpty)
    .filter((x) => isAllowedLanguage(x.language));

  const maxLines = Math.max(...langaugeAndColor.map((x) => x.lines).value());

  return langaugeAndColor
    .map((x) => ({
      ...x,
      percentage: normalizeByLogScale(x.lines / maxLines),
      name: x.language,
    }))
    .filter(minimumProportion)
    .omit('lines')
    .sortBy((x) => x.percentage)
    .reverse()
    .value();
};

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
