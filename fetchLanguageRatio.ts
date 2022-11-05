import { Octokit } from 'octokit';

const minimumVisibleLanguagePercentage = 0.01;

type GitHubLanguageResponse = { [languageName: string]: number };

type ParsedLanguage = {
  name: string;
  bytes: number;
};

export interface Language {
  name: string;
  bytes: number;
  percentage: number;
}

const fetchLanguageRatio = async () => {
  const languages = await fetchLanguageObject();
  const parsed = parseLanguageObject(languages);
  const ratioCalculated = calculateByteRatio(parsed);
  return ratioCalculated;
};

const fetchLanguageObject = async (): Promise<GitHubLanguageResponse> => {
  const octokit = new Octokit();
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/languages',
    {
      owner: 'yeolyi',
      repo: 'blog_src',
    }
  );
  return response.data;
};

const parseLanguageObject = (
  object: GitHubLanguageResponse
): ParsedLanguage[] => {
  const languages = Object.entries(object)
    .sort((a, b) => b[1] - a[1])
    .map((x) => ({ name: x[0], bytes: x[1] }));
  return languages;
};

const calculateByteRatio = (languages: ParsedLanguage[]): Language[] => {
  const largestBytes = languages.reduce((a, b) => Math.max(a, b.bytes), 0);
  const percentageAdded = languages
    .map((x) => {
      const percentage = x.bytes / largestBytes;
      const normalizedPercentage = normalizeByLogScale(percentage);
      return {
        ...x,
        percentage: normalizedPercentage,
      };
    })
    .filter((x) => minimumVisibleLanguagePercentage < x.percentage);
  return percentageAdded;
};

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
