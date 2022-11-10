import _, { Collection } from 'lodash';
import extensionMap from './extensionMap';
import { getLanguageColor } from './fetchLanguageRatio';
import { getAllCommits, ChangedFile, Commit } from './git';
import { notEmpty } from './lib/util';

interface Addon {
  added: number;
  colors: Collection<Color>;
}

interface Color {
  language: string;
  color: string;
  colorAmount: number;
}

const parseBlogStat = async (blogSrcDir: string) => {
  const commits = await getAllCommits(blogSrcDir);
  return _(commits)
    .map((commit) => ({
      ...commit,
      files: commit.files.filter(isAllowedFile),
    }))
    .filter(isAllowedCommit)
    .map((commit) => ({
      ...commit,
      ...calculateAddons(commit.files),
    }))
    .filter((commit) => commit.colors.size() > 0)
    .map((commit) => _.omit(commit, 'files'))
    .slice(0, 10);
};

const isAllowedFile = (changedFile: ChangedFile): boolean => {
  const { addedLinesCnt: addedLineCnt, filePath } = changedFile;
  return (
    !filePath.endsWith('package-lock.json') &&
    !filePath.endsWith('package.json') &&
    addedLineCnt !== 0
  );
};

const isAllowedCommit = (commit: Commit) => commit.files.length > 0;

const calculateAddons = (files: ChangedFile[]): Addon => {
  const colors = calculateColorRatio(files);
  return { added: sumLineAdded(files), colors };
};

const sumLineAdded = (files: ChangedFile[]) =>
  files.reduce((total, cur) => total + cur.addedLinesCnt, 0);

const calculateColorRatio = (changedFile: ChangedFile[]) => {
  const addedLinesInCommit = sumLineAdded(changedFile);
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

const extToLanguageAndColor = (
  ext: string
): { language: string; color: string } | null => {
  const language = extensionMap[ext];
  if (typeof language !== 'string') {
    return null;
  }
  const color = getLanguageColor(language);
  if (color === null) {
    return null;
  }
  return { language, color };
};

export default parseBlogStat;
