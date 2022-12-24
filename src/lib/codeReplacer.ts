import { readFile } from 'fs/promises';
import * as path from 'path';
import { replaceAsync } from './util';

export async function replaceCodeDirectives(
  content: string,
  postsDirectory: string
) {
  return replaceAsync(content, /!@([^@!]+)@!/g, async (a, x) => {
    const codeFullPath = path.join(postsDirectory, '../', x);
    try {
      const code = await readFile(codeFullPath, {
        encoding: 'utf8',
      });
      const splited = x.split('.');
      return `\`\`\`${splited[splited.length - 1]}\n${code.trim()}\n\`\`\``;
    } catch {
      throw new Error(`코드 대체 불가: ${codeFullPath}`);
    }
  });
}
