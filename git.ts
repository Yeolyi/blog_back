import simpleGit, { SimpleGitOptions } from 'simple-git';
import { mapAdjacentElement, notEmpty } from './lib/util';

export interface Commit {
  hash: string;
  message: string;
  date: string;
  files: ChangedFile[];
}

export interface ChangedFile {
  addedLinesCnt: number;
  deletedLinesCnt: number;
  filePath: string;
}

export const getAllCommits = async (dir: string): Promise<Commit[]> => {
  const options: Partial<SimpleGitOptions> = {
    baseDir: dir,
  };
  const git = simpleGit(options);

  const commits = (await git.log()).all;
  const diffPromises = mapAdjacentElement(
    commits,
    async (baseCommit, prevCommit) => {
      const diff = await git.diff([
        '--numstat',
        prevCommit.hash,
        baseCommit.hash,
      ]);
      const diffLines = splitLines(diff);
      const files = diffLines.map(parseDiffString).filter(notEmpty);
      return {
        hash: baseCommit.hash,
        message: baseCommit.message,
        date: baseCommit.date,
        files,
      };
    }
  );
  return await Promise.all(diffPromises);
};

const splitLines = (text: string) => text.split('\n');

const parseDiffString = (text: string): ChangedFile | null => {
  const regex = /(\d+)\s+(\d+)\s+(.+)/;
  const match = text.match(regex);
  if (match === null) {
    return null;
  }
  const [, addedLineCntStr, deletedLineCntStr, filePath] = match;
  const addedLinesCnt = +addedLineCntStr;
  const deletedLinesCnt = +deletedLineCntStr;
  if (!Number.isInteger(addedLinesCnt) || !Number.isInteger(deletedLinesCnt)) {
    return null;
  }
  return {
    addedLinesCnt,
    deletedLinesCnt,
    filePath,
  };
};
