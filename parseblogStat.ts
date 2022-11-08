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

  const { all: commits } = await git.log();

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

      const colorMap: {
        [ext: string]: { color: string; language: string; colorAmount: number };
      } = {};

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

        const extTemp = match[3].split('.');
        const ext = extTemp[extTemp.length - 1];

        const language = extensionMap[ext];
        if (typeof language !== 'string') {
          return;
        }

        const color = getLanguageColor(language);
        colorMap[ext] = {
          language,
          color,
          colorAmount: colorMap[ext]?.colorAmount ?? 0 + added,
        };
      });

      if (added === 0) {
        return null;
      }

      const colorMapMax = Object.values(colorMap).reduce(
        (a, b) => a + b.colorAmount,
        0
      );
      const temp = Object.values(colorMap)
        .sort((a, b) => (a.language < b.language ? -1 : 1))
        .map((x) => ({ ...x, colorAmount: x.colorAmount / colorMapMax }));

      return {
        message: baseCommit.message,
        added,
        colors: temp,
        date: baseCommit.date,
      };
    }
  );

  return (await Promise.all(commitStatsPromise))
    .filter((x) => x !== null)
    .slice(0, 10);
};

export default parseBlogStat;
