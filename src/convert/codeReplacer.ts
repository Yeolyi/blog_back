import { readFile } from 'fs/promises';
import * as path from 'path';
import { extractFileExtension } from '../data/extensionMap';
import { replaceAsync } from '../lib/util';

const codeContentRegex = /!@([^@!]+)@!/g;

export const replaceCodeDirectives = async (
  content: string,
  postAbsolutePath: string
) => {
  const replacer = async (match: string, codeFileRelativePath: string) => {
    const codeFullPath = path.join(
      postAbsolutePath,
      '../',
      codeFileRelativePath
    );
    try {
      const extension = extractFileExtension(codeFileRelativePath);
      const code = await readFile(codeFullPath, {
        encoding: 'utf8',
      });
      return formatMarkdownCode(extension, code);
    } catch {
      throw new Error(`코드 대체 불가: ${codeFullPath}`);
    }
  };
  return replaceAsync(content, codeContentRegex, replacer);
};

const formatMarkdownCode = (fileExtension: string, code: string) =>
  `\`\`\`${fileExtension}\n${code.trim()}\n\`\`\``;
