import { readFile, rm, cp } from 'fs/promises';
import matter from 'gray-matter';
import { PostData, MarkdownMetaData } from './types';
import { replaceCodeDirectives } from './codeReplacer';
import { iteratePathTree, buildPathTree } from './lib/pathTree';
import { join, relative } from 'path';
import { fileExists, getSrcPath, makeDirAndWriteFile } from './lib/file';

export async function convertAll() {
  await removeConvertedFolderIfExists();
  const postPaths = await getPostPaths();

  for (const postPath of postPaths) {
    const postData = await makePostData(postPath);
    storePostDataToFile(postData);
  }
}

const removeConvertedFolderIfExists = async () => {
  if (await fileExists('converted')) {
    await rm('converted', { recursive: true });
  }
};

async function getPostPaths(): Promise<string[]> {
  const srcPath = getSrcPath();
  const treeRoot = await buildPathTree(srcPath);
  const paths: string[] = [];

  await iteratePathTree(treeRoot, async ({ path }) => {
    if (shouldCopyPath(path)) {
      const destPath = convertSrcPathToConvertedPath(path);
      cp(path, destPath, { recursive: true });
    }
    if (path.endsWith('index.md')) {
      paths.push(path);
    }
  });

  return paths;
}

const shouldCopyPath = (path: string) => {
  return path.endsWith('build') || path.endsWith('build/');
};

const storePostDataToFile = async (postData: PostData) => {
  const json = JSON.stringify(postData);
  const absolutePath = join(getSrcPath(), postData.path);
  const markdownDir = convertSrcPathToConvertedPath(absolutePath);
  await makeDirAndWriteFile(markdownDir, json);
};

const convertSrcPathToConvertedPath = (path: string) => {
  const srcPath = getSrcPath();
  const relativePath = relative(srcPath, path);
  return join(process.cwd(), 'converted', relativePath);
};

async function makePostData(postPath: string): Promise<PostData> {
  const fileContents = await readFile(postPath, { encoding: 'utf8' });
  const matterResult = matter(fileContents);
  const metaData = matterResult.data as MarkdownMetaData;

  const content = await replaceCodeDirectives(matterResult.content, postPath);

  const filePath = relative(getSrcPath(), postPath);
  const directoryPath = filePath.split('/').slice(0, -1).join('/');

  return {
    metaData,
    content,
    path: directoryPath,
    pathArr: [],
  };
}
