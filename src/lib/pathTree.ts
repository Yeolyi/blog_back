import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import { mapAsync, notEmpty } from './util';

export type PathNode = FileNode | DirectoryNode;

export type FileNode = {
  type: 'FILE';
  path: string;
};

export type DirectoryNode = {
  type: 'DIRECTORY';
  path: string;
  children: PathNode[];
};

export const preorderTraversePathTree = async (
  node: PathNode,
  f: (node: PathNode) => Promise<void>
) => {
  await f(node);
  node.type === 'DIRECTORY' &&
    (await mapAsync(node.children, (node) =>
      preorderTraversePathTree(node, f)
    ));
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
