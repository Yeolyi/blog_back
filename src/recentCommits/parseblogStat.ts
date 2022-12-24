import _ from 'lodash';
import {
  extractFileExtension,
  extToLanguageAndColor,
} from '../data/extensionMap';
import { getAllCommits } from './git';
import { getSrcPath } from '../lib/file';
import { ChangedFile, CommitDiff, CommitWithChangedFiles } from './type';
import { notEmpty } from '../lib/util';

const parseBlogStat = async (count: number): Promise<CommitDiff[]> => {
  const blogSrcDir = getSrcPath();
  const commits = await getAllCommits(blogSrcDir);

  const fileFiltered = _(commits).map((commit) => ({
    ...commit,
    files: commit.files.filter(isAllowedFile),
  }));

  const commitFiltered = fileFiltered.filter(isAllowedCommit);

  return commitFiltered
    .map(calculateAddons)
    .filter((commit) => commit.colors.length > 0)
    .slice(0, count)
    .value();
};

const isAllowedFile = (changedFile: ChangedFile): boolean => {
  const { addedLinesCnt, filePath } = changedFile;
  return addedLinesCnt !== 0 && isAllowedFilePath(filePath);
};

const isAllowedFilePath = (filePath: string) => {
  return (
    !filePath.endsWith('package-lock.json') &&
    !filePath.endsWith('package.json') &&
    !filePath.endsWith('bundle.js')
  );
};

const isAllowedCommit = (commit: CommitWithChangedFiles) =>
  commit.files.length > 0;

const calculateAddons = (commit: CommitWithChangedFiles): CommitDiff => {
  const extensions = removeDuplicate(
    commit.files.map((x) => extractFileExtension(x.filePath))
  );
  const languageNames = extensions
    .map(extToLanguageAndColor)
    .filter(notEmpty)
    .map((x) => x.language);
  return {
    hash: commit.hash,
    message: commit.message,
    date: commit.date,
    added: sumLineAdded(commit.files),
    colors: languageNames.map((x) => ({ language: x })),
  };
};

const removeDuplicate = (arr: string[]) => [...new Set(arr)];

const sumLineAdded = (files: ChangedFile[]) =>
  files.reduce((total, cur) => total + cur.addedLinesCnt, 0);

export default parseBlogStat;
