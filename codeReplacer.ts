import { readFile } from 'fs/promises';
import path from 'path';

export async function replaceCodeDirectives(
  content: string,
  postsDirectory: string
) {
  return replaceAsync(content, /!@([^@!]+)@!/g, async (a, x) => {
    const codeFullPath = path.join(postsDirectory, x);
    try {
      const code = await readFile(codeFullPath, {
        encoding: 'utf8',
      });
      return `\`\`\`${x.split('.')[1]}\n${code.trim()}\n\`\`\``;
    } catch {
      console.error(`코드 대체 불가: ${codeFullPath}`);
      return '';
    }
  });
}

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (str: string, p1: string) => Promise<string>
) {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match, p1) => {
    const promise = asyncFn(match, p1);
    promises.push(promise);
    return '';
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift() ?? '');
}
