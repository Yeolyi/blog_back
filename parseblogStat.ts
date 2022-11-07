import simpleGit, { SimpleGitOptions } from 'simple-git';
import extensionMap from './extensionMap';
import { getLanguageColor } from './fetchLanguageRatio';

const parseBlogStat = async () => {
  const blogSrcDir = process.env.BLOG_SRC_DIR;
  if (blogSrcDir === undefined) {
    throw new Error('BLOG_SRC_DIR 환경 변수 없음');
  }
  const options: Partial<SimpleGitOptions> = {
    baseDir: blogSrcDir,
  };
  const git = simpleGit(options);

  const { all: commits } = await git.log(['-10']);

  const commitStatsPromise = [...Array(commits.length - 1).keys()].map(
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
      const colorMap: { [color: string]: number } = {};

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

        const extTemp = match[3].split('.');
        const ext = extTemp[extTemp.length - 1];

        const language = extensionMap[ext];
        if (typeof language !== 'string') {
          return;
        }

        const color = getLanguageColor(language);
        colorMap[color] = (colorMap[color] ?? 0) + +match[1];
      });

      if (added === 0) {
        return null;
      }

      const colorMapMax = Object.values(colorMap).reduce((a, b) => a + b, 0);
      const temp = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .reduce<[string, number][]>(
          (prev, cur) => [...prev, [cur[0], cur[1] / colorMapMax]],
          []
        );

      return {
        message: baseCommit.message,
        added,
        deleted,
        description: diff,
        colors: temp,
      };
    }
  );

  return (await Promise.all(commitStatsPromise)).filter((x) => x !== null);
};

export default parseBlogStat;
