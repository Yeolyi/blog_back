import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import { mapAsync, notEmpty } from './util';

type PathNode = FileNode | DirectoryNode;

type FileNode = {
  type: 'FILE';
  path: string;
};

type DirectoryNode = {
  type: 'DIRECTORY';
  path: string;
  children: PathNode[];
};

export const iteratePathTree = async (
  node: PathNode,
  f: (node: PathNode) => Promise<void>
) => {
  await f(node);
  node.type === 'DIRECTORY' &&
    (await mapAsync(node.children, (node) => iteratePathTree(node, f)));
};

export const buildPathTree = async (
  startDirectory: string
): Promise<PathNode> => {
  return {
    type: 'DIRECTORY',
    path: startDirectory,
    children: await makePathNode(startDirectory),
  };
};

const makePathNode = async (path: string): Promise<PathNode[]> => {
  const fileAndDirectoryNames = await readdir(path);
  return (
    await mapAsync(fileAndDirectoryNames, async (name) => {
      if (isIgnoredPath(name)) {
        return null;
      }
      const namePath = join(path, name);
      if (await isDirectory(namePath)) {
        const children = await makePathNode(namePath);
        return {
          type: 'DIRECTORY' as const,
          path: namePath,
          children,
        };
      } else {
        return {
          type: 'FILE' as const,
          path: namePath,
        };
      }
    })
  ).filter(notEmpty);
};

const isIgnoredPath = (path: string) =>
  path === 'node_modules' || path.startsWith('.');

const isDirectory = async (path: string) => {
  const stat = await lstat(path);
  return stat.isDirectory();
};
