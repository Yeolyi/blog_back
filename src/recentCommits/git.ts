import simpleGit, {
  DefaultLogFields,
  ListLogLine,
  SimpleGit,
} from 'simple-git';
import { notEmpty } from '../lib/util';
import { ChangedFile, CommitWithChangedFiles } from './type';

export const getAllCommits = async (
  baseDir: string
): Promise<CommitWithChangedFiles[]> => {
  const git = simpleGit({ baseDir });
  const commits = (await git.log()).all;
  const diffPromises = mapAdjacentElement(
    commits,
    addChangedFileInfoToCommit(git)
  );
  return await Promise.all(diffPromises);
};

const addChangedFileInfoToCommit = (git: SimpleGit) => {
  return async (
    baseCommit: DefaultLogFields & ListLogLine,
    prevCommit: DefaultLogFields & ListLogLine
  ) => {
    const diff = await git.diff([
      '--numstat',
      prevCommit.hash,
      baseCommit.hash,
    ]);
    const files = splitLines(diff).map(parseDiffString).filter(notEmpty);
    return {
      hash: baseCommit.hash,
      message: baseCommit.message,
      date: baseCommit.date,
      files,
    };
  };
};

const splitLines = (text: string) => text.split('\n');

// 입력 예제: '24      0       dict/index.md'
const parseDiffString = (diffStr: string): ChangedFile | null => {
  const regex = /(\d+)\s+(\d+)\s+(.+)/;
  const match = diffStr.match(regex);
  if (match === null) {
    return null;
  }
  const [, addedLineCntStr, deletedLineCntStr, filePath] = match;
  const addedLinesCnt = +addedLineCntStr;
  const deletedLinesCnt = +deletedLineCntStr;
  if (![addedLinesCnt, deletedLinesCnt].every(Number.isInteger)) {
    return null;
  }
  return {
    addedLinesCnt,
    deletedLinesCnt,
    filePath,
  };
};

const mapAdjacentElement = <T, U>(
  arr: readonly T[],
  f: (prev: T, next: T) => U
) => {
  return [...Array(arr.length - 1).keys()].map((idx) => {
    const left = arr[idx];
    const right = arr[idx + 1];
    return f(left, right);
  });
};
