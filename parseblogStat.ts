import _ from 'lodash';
import extensionMap from './extensionMap';
import { getLanguageColor } from './fetchLanguageRatio';
import { allDiffBetweenCommits } from './git';
import { notEmpty } from './lib/util';

interface ChangedFile {
  addedLinesCnt: number;
  deletedLinesCnt: number;
  filePath: string;
}

const parseBlogStat = async (blogSrcDir: string) => {
  const diffs = await allDiffBetweenCommits(blogSrcDir);
  const promise = diffs.map(async ({ baseCommit, diff }) => {
    const result = await parseDiff(diff);
    if (result === null) {
      return null;
    }
    return {
      message: baseCommit.message,
      date: baseCommit.date,
      ...result,
    };
  });

  return (await Promise.all(promise)).filter(notEmpty);
};

const parseDiff = async (diff: string) => {
  const changedFiles = mapLines(diff, parseDiffString)
    .filter(notEmpty)
    .filter(isAllowedFile);
  if (changedFiles.length === 0) {
    return null;
  }
  const addedLinesInCommit = changedFiles.reduce(
    (prev, cur) => prev + cur.addedLinesCnt,
    0
  );
  const colors = calculateColorRatio(changedFiles);
  return {
    added: addedLinesInCommit,
    colors,
  };
};

const mapLines = <T>(text: string, f: (line: string) => T) =>
  text.split('\n').map(f);

const parseDiffString = (text: string): ChangedFile | null => {
  const regex = /(\d+)\s+(\d+)\s+(.+)/;
  const match = text.match(regex);
  if (match === null) {
    return null;
  }
  const addedLinesCnt = +match[1];
  const deletedLinesCnt = +match[2];
  const filePath = match[3];
  if (!Number.isInteger(addedLinesCnt) || !Number.isInteger(deletedLinesCnt)) {
    return null;
  }
  return {
    addedLinesCnt,
    deletedLinesCnt,
    filePath,
  };
};

const isAllowedFile = (changedFile: ChangedFile): boolean => {
  const { addedLinesCnt: addedLineCnt, filePath } = changedFile;
  return (
    !filePath.endsWith('package-lock.json') &&
    !filePath.endsWith('package.json') &&
    addedLineCnt !== 0
  );
};

const calculateColorRatio = (changedFile: ChangedFile[]) => {
  const addedLinesInCommit = changedFile.reduce(
    (prev, cur) => prev + cur.addedLinesCnt,
    0
  );
  return _(changedFile)
    .groupBy((x) => extractFileExtension(x.filePath))
    .mapValues((x) => x.reduce((a, b) => a + b.addedLinesCnt, 0))
    .entries()
    .map(([ext, addedLineOfFile]) => {
      const languageAndColor = extToLanguageAndColor(ext);
      if (languageAndColor === null) {
        return null;
      }
      return {
        ...languageAndColor,
        colorAmount: addedLineOfFile / addedLinesInCommit,
      };
    })
    .filter(notEmpty)
    .sortBy((x) => x.colorAmount)
    .reverse();
};

const extractFileExtension = (path: string) => {
  const splited = path.split('.');
  const ext = splited[splited.length - 1];
  return ext;
};

const extToLanguageAndColor = (ext: string) => {
  const language = extensionMap[ext];
  if (typeof language !== 'string') {
    return null;
  }
  const color = getLanguageColor(language);
  return { language, color };
};

export default parseBlogStat;
