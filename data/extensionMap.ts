import languageColors from './languageColors';

const extensionMap: { [extensionName: string]: keyof typeof languageColors } = {
  js: 'JavaScript',
  jsx: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  md: 'Markdown',
  html: 'HTML',
  bash: 'Shell',
  json: 'JSON',
  c: 'C',
  swift: 'Swift',
  java: 'Java',
  handlebars: 'Handlebars',
  py: 'Python',
  go: 'Go',
  clj: 'Clojure',
  css: 'CSS',
};

export const pathToLanguageAndColor = (path: string) => {
  const ext = extractFileExtension(path);
  return extToLanguageAndColor(ext);
};

export const extractFileExtension = (path: string) => {
  const splited = path.split('.');
  const ext = splited[splited.length - 1];
  return ext;
};

export const extToLanguageAndColor = (
  ext: string
): { language: string; color: string } | null => {
  const language = extensionMap[ext];
  if (typeof language !== 'string') {
    return null;
  }

  const color = languageColors[language].color;
  if (color === null) {
    return null;
  }
  return { language, color };
};
