import languageColors from './languageColors';

const extensionMap: { [extensionName: string]: keyof typeof languageColors } = {
  js: 'JavaScript',
  jsx: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  md: 'Markdown',
  html: 'HTML',
  bash: 'Shell',
  gitignore: 'Git Attributes',
  json: 'JSON',
  c: 'C',
  swift: 'Swift',
  java: 'Java',
  prettierignore: 'Ignore List',
  handlebars: 'Handlebars',
  py: 'Python',
  go: 'Go',
  clj: 'Clojure',
  css: 'CSS',
  xml: 'XML',
};

export default extensionMap;
