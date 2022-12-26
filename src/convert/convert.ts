import { readFile, rm, cp, mkdir, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { PostData, MarkdownMetaData, ParentPost } from './types';
import { replaceCodeDirectives } from './codeReplacer';
import {
  preorderTraversePathTree,
  buildPathTree,
  PathNode,
} from '../lib/pathTree';
import { join, relative } from 'path';
import { fileExists, getSrcPath } from '../lib/file';
import simpleGit from 'simple-git';

// 메모리 사용을 줄이기 위해 만들어진 PostData는 파일로 저장 후 사용하지 않음
// 이때 이전에 만든 PostData의 정보가 필요한 경우가 있어 딱 필요한 정보만 간단히 저장
// 지금은 title만 저장하는 상태
type PostCache = {
  [mdAbsolutePath: string]: string;
};

export const convertAll = async () => {
  await prepareConvert();
  const root = await buildPathTree(getSrcPath());
  await handleStaticFiles(root);
  await handlePost(root);
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

const isMarkdownFile = (path: string) => {
  return path.endsWith('index.md');
};

// directory에 있는 index.md를 어떻게든 우선 찾아야한다.
// DFS가 아니라 BFS로
const handlePost = async (root: PathNode) => {
  const cache: PostCache = {};
  const queue: PathNode[] = [root];
  let idx = 0;

  while (idx < queue.length) {
    const cur = queue[idx];
    if (cur.type === 'FILE') {
      if (isMarkdownFile(cur.path)) {
        const postData = await makePostData(cur.path, cache);
        cache[cur.path] = postData.metaData.title;
        storePostData(postData, cur.path);
      }
    } else {
      for (const node of cur.children) {
        queue.push(node);
      }
    }
    idx++;
  }
};

const makePostData = async (
  mdAbsolutePath: string,
  postCache: PostCache
): Promise<PostData> => {
  const fileContents = await readFile(mdAbsolutePath, {
    encoding: 'utf8',
  });
  const { data: metaDataFromMDFile, content } = matter(fileContents);
  const { lastModified, created } = await getHistory(mdAbsolutePath);

  const codeReplacedContent = await replaceCodeDirectives(
    content,
    mdAbsolutePath
  );

  const parents = getPostParent(mdAbsolutePath, postCache);

  return {
    metaData: {
      ...metaDataFromMDFile,
      lastModified,
      created,
    } as MarkdownMetaData,
    content: codeReplacedContent,
    parents,
  };
};

const getHistory = async (mdAbsolutePath: string) => {
  const git = simpleGit(getSrcPath());
  const mdRelativePath = relative(getSrcPath(), mdAbsolutePath);
  const log = await git.log({
    file: mdRelativePath,
    '--follow': null,
  });
  return {
    lastModified: log.latest?.date,
    created: log.all[log.all.length - 1].date,
  };
};

const getPostParent = (
  mdAbsolutePath: string,
  postCache: PostCache
): ParentPost[] => {
  const parents: ParentPost[] = [];
  const srcPath = getSrcPath();
  let possibleParentPath = mdAbsolutePath;

  while (possibleParentPath !== srcPath) {
    possibleParentPath = join(possibleParentPath, '..');
    const indexPath = possibleParentPath + '/index.md';
    if (indexPath in postCache) {
      const path = relative(srcPath, possibleParentPath);
      parents.push({
        path,
        title: postCache[indexPath],
      });
    }
  }

  parents.reverse();

  return parents;
};

const storePostData = async (postData: PostData, mdAbsolutePath: string) => {
  const directoryPath = getMDContainingDirectoryPath(mdAbsolutePath);
  const markdownDir = convertSrcPathToConvertedPath(directoryPath);
  await saveIndexJSON(markdownDir, postData);
};

const getMDContainingDirectoryPath = (mdAbsolutePath: string) =>
  mdAbsolutePath.split('/').slice(0, -1).join('/');

export const saveIndexJSON = async (absolutePath: string, object: object) => {
  await mkdir(absolutePath, { recursive: true });
  const jsonFilePath = join(absolutePath, 'index.json');
  await writeFile(jsonFilePath, JSON.stringify(object));
};
