import simpleGit, { SimpleGitOptions } from 'simple-git';
import { mapAdjacentElement } from './lib/util';

export const allDiffBetweenCommits = async (dir: string) => {
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
      return { baseCommit, diff };
    }
  );

  return await Promise.all(diffPromises);
};
