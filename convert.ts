import { readFile, mkdir, writeFile, readdir, lstat, rm } from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { PostData, MarkdownMetaData } from './types';
import { replaceCodeDirectives } from './codeReplacer';
import { existsSync } from 'fs';
import { filterAsync, mapAsync } from './lib/util';

const currentDirectory = process.cwd();

export async function convertAll() {
  await removeConvertedFolderIfExists();

  const postPaths = await getPostPaths();

  for (const postPath of postPaths) {
    const postData = await makePostData(postPath);
    storePostDataToFile(postData);
  }
}

const removeConvertedFolderIfExists = async () => {
  if (existsSync('converted')) {
    await rm('converted', { recursive: true });
  }
};

async function getPostPaths(startPath = '/'): Promise<string[]> {
  const directories = await listAllDirectoryNamesInPath(startPath);
  const paths = (
    await mapAsync(directories, async (directoryName) => {
      const directoryPath = path.join(startPath, directoryName);
      return await getPostPaths(directoryPath);
    })
  ).flat();

  if (await isIndexFileExist(startPath)) {
    paths.push(startPath);
  }

  return paths;
}

const listAllDirectoryNamesInPath = async (
  postPath: string
): Promise<string[]> => {
  const targetPath = addMarkdownDirectoryPrefix(postPath);
  const pathContent = await readdir(targetPath);
  return await filterAsync(pathContent, async (contentName) => {
    const contentPath = path.join(targetPath, contentName);
    const stat = await lstat(contentPath);
    return stat.isDirectory();
  });
};

const isIndexFileExist = async (postPath: string) => {
  const targetPath = addMarkdownDirectoryPrefix(postPath);
  const pathContent = await readdir(targetPath);
  return pathContent.includes('index.md');
};

const storePostDataToFile = async (postData: PostData) => {
  const json = JSON.stringify(postData);

  const dir = path.join(currentDirectory, 'converted', postData.path);
  await mkdir(dir, { recursive: true });

  const jsonFilePath = path.join(dir, 'index.json');
  writeFile(jsonFilePath, json);
};

async function makePostData(postPath: string): Promise<PostData> {
  const targetPath = addMarkdownDirectoryPrefix(postPath);
  const indexFilePath = path.join(targetPath, 'index.md');
  const fileContents = await readFile(indexFilePath, { encoding: 'utf8' });

  const matterResult = matter(fileContents);
  const matterData = matterResult.data as MarkdownMetaData;

  const content = await replaceCodeDirectives(matterResult.content, targetPath);

  return {
    pathArr: [],
    metaData: matterData,
    content,
    path: postPath,
  };
}

const addMarkdownDirectoryPrefix = (postPath: string) =>
  path.join(getMarkdownDirectory(), postPath);

const getMarkdownDirectory = () => {
  const blogSrcDir = process.env.BLOG_SRC_DIR;
  if (blogSrcDir === undefined) {
    throw new Error('BLOG_SRC_DIR 환경 변수 없음');
  }
  return path.join(currentDirectory, blogSrcDir);
};
