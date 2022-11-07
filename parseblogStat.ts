import simpleGit, { SimpleGitOptions } from 'simple-git';

const parseBlogStat = async () => {
  const blogSrcDir = process.env.BLOG_SRC_DIR;
  if (blogSrcDir === undefined) {
    throw new Error('BLOG_SRC_DIR 환경 변수 없음');
  }
  const options: Partial<SimpleGitOptions> = {
    baseDir: blogSrcDir,
  };
  const git = simpleGit(options);

  const maxCommit = 30;
  const { all: commits } = await git.log([`-${maxCommit}`]);

  const commitStatsPromise = [...Array(maxCommit - 1).keys()].map(
    async (idx) => {
      const baseCommit = commits[idx];
      const previousCommit = commits[idx + 1];
      const diff = await git.diff([
        '--numstat',
        previousCommit.hash,
        baseCommit.hash,
      ]);
      const lines = diff.split('\n');
      let added = 0;
      let deleted = 0;
      lines.forEach((line) => {
        const regex = /(\d+)\s+(\d+)\s+(.+)/;
        const match = line.match(regex);
        if (match === null) {
          return;
        }
        if (
          match[3].endsWith('package-lock.json') ||
          match[3].endsWith('package.json')
        ) {
          return;
        }
        added += +match[1];
        deleted += +match[2];
      });
      return {
        message: baseCommit.message,
        added,
        deleted,
      };
    }
  );

  return Promise.all(commitStatsPromise);
};

export default parseBlogStat;
