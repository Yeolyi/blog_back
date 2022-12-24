import { readFile, rm, cp, mkdir, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { PostData, MarkdownMetaData } from './types';
import { replaceCodeDirectives } from './codeReplacer';
import {
  preorderTraversePathTree,
  buildPathTree,
  PathNode,
} from '../lib/pathTree';
import { join, relative } from 'path';
import { fileExists, getSrcPath } from '../lib/file';

export const convertAll = async () => {
  await prepareConvert();
  const root = await buildPathTree(getSrcPath());

  await handleStaticFiles(root);

  const postPaths = await getMarkdownFilePaths(root);
  postPaths.forEach(async (postPath) => {
    const postData = await makePostData(postPath);
    storePostData(postData);
  });
};

const prepareConvert = async () => {
  if (await fileExists('converted')) {
    await rm('converted', { recursive: true });
  }
};

const handleStaticFiles = async (root: PathNode) => {
  await preorderTraversePathTree(root, async ({ path }) => {
    if (shouldCopyPath(path)) {
      const destPath = convertSrcPathToConvertedPath(path);
      cp(path, destPath, { recursive: true });
    }
  });
};

const shouldCopyPath = (path: string) => {
  return path.endsWith('build');
};

const convertSrcPathToConvertedPath = (absolutePath: string) => {
  const srcPath = getSrcPath();
  const relativePath = relative(srcPath, absolutePath);
  return join(process.cwd(), 'converted', relativePath);
};

const getMarkdownFilePaths = async (root: PathNode): Promise<string[]> => {
  const paths: string[] = [];
  await preorderTraversePathTree(root, async ({ path }) => {
    if (isMarkdownFile(path)) {
      paths.push(path);
    }
  });
  return paths;
};

const isMarkdownFile = (path: string) => {
  return path.endsWith('index.md');
};

const makePostData = async (postPath: string): Promise<PostData> => {
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
  };
};

const storePostData = async (postData: PostData) => {
  const absolutePath = join(getSrcPath(), postData.path);
  const markdownDir = convertSrcPathToConvertedPath(absolutePath);
  await saveIndexJSON(markdownDir, postData);
};

export const saveIndexJSON = async (absolutePath: string, object: object) => {
  await mkdir(absolutePath, { recursive: true });
  const jsonFilePath = join(absolutePath, 'index.json');
  await writeFile(jsonFilePath, JSON.stringify(object));
};
