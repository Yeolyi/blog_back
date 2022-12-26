import _ from 'lodash';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  extractFileExtension,
  extToLanguageAndColor,
} from '../data/extensionMap';
import { getFileSize, getSrcPath } from '../lib/file';
import { preorderTraversePathTree, buildPathTree } from '../lib/pathTree';
import { mapAsync } from '../lib/util';
import { CodeMetadata, Language } from './type';

const fetchLanguageRatio = async (): Promise<Language[]> => {
  const markdownFilePaths = await getMarkdownFilePaths();
  const codeMetadata = (
    await mapAsync(markdownFilePaths, getMarkdownCodeMetadata)
  ).flat();

  const languageWithoutPercentage: {
    [language: string]: Omit<Language, 'percentage'>;
  } = {};

  codeMetadata.forEach(({ extension, bytes }) => {
    const langaugeAndColor = convertExtensionToLanguageIfExist(extension);
    if (langaugeAndColor === null) {
      return null;
    }
    const { language, color } = langaugeAndColor;
    if (languageWithoutPercentage[language] === undefined) {
      languageWithoutPercentage[language] = {
        language,
        color,
        bytes,
      };
    } else {
      languageWithoutPercentage[language].bytes += bytes;
    }
  });

  const biggestByteSize = Math.max(
    ...Object.values(languageWithoutPercentage).map((x) => x.bytes)
  );

  return _(languageWithoutPercentage)
    .map((x) => ({
      ...x,
      percentage: normalizeByLogScale(x.bytes / biggestByteSize),
    }))
    .filter(minimumProportion)
    .sortBy((x) => x.bytes)
    .reverse()
    .value();
};

const getMarkdownFilePaths = async () => {
  const fileTree = await buildPathTree(getSrcPath());
  const markdownFilePaths: string[] = [];
  await preorderTraversePathTree(fileTree, async (node) => {
    if (isMarkdownFile(node.path)) {
      markdownFilePaths.push(node.path);
    }
  });
  return markdownFilePaths;
};

const isMarkdownFile = (path: string) => path.endsWith('.md');

const getMarkdownCodeMetadata = async (
  markdownFilePath: string
): Promise<CodeMetadata[]> => {
  const content = await getMarkdownContent(markdownFilePath);
  const codeDirectivesMetadata = await getMarkdownCodeDirectivesMetadata(
    markdownFilePath,
    content
  );
  const inlinedCodeExtensionAndSize = getMarkdownInlineCodeMetadata(content);

  return [...codeDirectivesMetadata, ...inlinedCodeExtensionAndSize];
};

const getMarkdownContent = async (markdownFilePath: string) => {
  return await readFile(markdownFilePath, { encoding: 'utf-8' });
};

const getMarkdownCodeDirectivesMetadata = async (
  markdownFilePath: string,
  content: string
): Promise<CodeMetadata[]> => {
  const codePaths = await findCodePathsInMarkdown(markdownFilePath, content);
  return await mapAsync(codePaths, async (path) => ({
    extension: extractFileExtension(path),
    bytes: await getFileSize(path),
  }));
};

const findCodePathsInMarkdown = async (
  markdownFilePath: string,
  content: string
) => {
  const directiveRegex = /!@([^@!]+)@!/g;
  return [...content.matchAll(directiveRegex)]
    .map((x) => x[1])
    .map((x) => join(markdownFilePath, '../', x));
};

const getMarkdownInlineCodeMetadata = (
  markdownContent: string
): CodeMetadata[] => {
  const inlineCodeRegex = /```([a-z]+)\n([\S|\s]+?)(?=```)/g;
  return [...markdownContent.matchAll(inlineCodeRegex)].map((x) => ({
    extension: x[1],
    bytes: getStringSizeInByte(x[2]),
  }));
};

const getStringSizeInByte = (x: string) => Buffer.byteLength(x[2], 'utf-8');

const convertExtensionToLanguageIfExist = (extension: string) => {
  const langaugeAndColor = extToLanguageAndColor(extension);
  if (langaugeAndColor === null) {
    return null;
  }
  if (!isAllowedLanguage(langaugeAndColor.language)) {
    return null;
  }
  return langaugeAndColor;
};

const isAllowedLanguage = (languageName: string) => {
  return languageName !== 'Markdown';
};

const minimumProportion = (language: Language) => language.percentage > 0.01;

const normalizeByLogScale = (x: number) => {
  if (0 <= x && x <= 1) {
    return getBase2Log(x + 1);
  } else {
    throw new Error(`Invalid number range: ${x}`);
  }
};

const getBase2Log = (x: number) => {
  return Math.log(x) / Math.log(2);
};

export default fetchLanguageRatio;
