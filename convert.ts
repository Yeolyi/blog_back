import { readFile, mkdir, writeFile, readdir, lstat } from 'fs/promises';
import * as path from 'path';
import matter = require('gray-matter');
import { PostData, MarkdownMetaData } from './types';
import { replaceCodeDirectives } from './codeReplacer';

const currentDirectory = process.cwd();
const markdownDirectory = path.join(currentDirectory, 'blog_src');
const indexFileName = 'index.md';

export async function convertAll() {
  const postPaths = await getPostPaths();

  for (const postPath of postPaths) {
    const postData = await getPostData(postPath);
    const json = JSON.stringify(postData);
    const jsonDir = path.join(currentDirectory, 'converted', ...postPath);
    const jsonFilePath = path.join(jsonDir, 'index.md');
    await mkdir(jsonDir, { recursive: true });

    writeFile(jsonFilePath, json);
  }
}

export async function getPostData(pathArr: string[]): Promise<PostData> {
  const postPath = path.join(markdownDirectory, ...pathArr);
  const indexFilePath = path.join(postPath, indexFileName);
  const fileContents = await readFile(indexFilePath, { encoding: 'utf8' });

  const matterResult = matter(fileContents);
  const matterData = matterResult.data as MarkdownMetaData;

  const content = await replaceCodeDirectives(matterResult.content, postPath);

  return {
    pathArr,
    metaData: matterData,
    content,
  };
}

export async function getPostPaths(
  pathArr: string[] = []
): Promise<string[][]> {
  const currentPath = path.join(markdownDirectory, ...pathArr);
  const pathContent = await readdir(currentPath);
  const currentPathContentNames = pathContent.filter((x) => x !== 'legacy');

  const directories = await filterAsync(
    currentPathContentNames,
    async (contentName) => {
      const contentPath = path.join(currentPath, contentName);
      const stat = await lstat(contentPath);
      return stat.isDirectory();
    }
  );

  const paths = (
    await Promise.all(
      directories.map(async (directoryName) => {
        return await getPostPaths([...pathArr, directoryName]);
      })
    )
  ).flat();

  if (currentPathContentNames.includes('index.md')) {
    paths.push(pathArr);
  }
  return paths;
}

async function filterAsync(
  arr: string[],
  callback: (val: string) => Promise<boolean>
): Promise<string[]> {
  const temp = arr.map(async (item) => ((await callback(item)) ? item : false));
  const resolved = await Promise.all(temp);
  return resolved.filter(isString);
}

function isString(x: string | false): x is string {
  return typeof x === 'string';
}