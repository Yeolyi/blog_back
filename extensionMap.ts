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

export default extensionMap;
