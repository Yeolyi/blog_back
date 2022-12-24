import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import { mapAsync, notEmpty } from './util';

export type PathNode = FileNode | DirectoryNode;

export type FileNode = {
  type: 'FILE';
  path: string;
  parent?: DirectoryNode;
};

export type DirectoryNode = {
  type: 'DIRECTORY';
  path: string;
  children: PathNode[];
  parent?: DirectoryNode;
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
): Promise<DirectoryNode> => {
  const ret: DirectoryNode = {
    type: 'DIRECTORY',
    path: startDirectory,
    children: [],
  };
  ret.children = await makePathNode(startDirectory, ret);
  return ret;
};

const makePathNode = async (
  path: string,
  parent: DirectoryNode
): Promise<PathNode[]> => {
  const fileAndDirectoryNames = await readdir(path);
  return (
    await mapAsync(fileAndDirectoryNames, async (name) => {
      if (isIgnoredPath(name)) {
        return null;
      }
      const namePath = join(path, name);
      if (await isDirectory(namePath)) {
        const ret: DirectoryNode = {
          type: 'DIRECTORY',
          path: namePath,
          children: [],
        };
        ret.children = await makePathNode(namePath, ret);
        return ret;
      } else {
        return {
          type: 'FILE' as const,
          path: namePath,
          parent,
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
