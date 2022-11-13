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
  childPath: PathNode[];
};

export const iteratePathTree = async (
  node: PathNode,
  f: (node: PathNode) => Promise<void>
) => {
  await f(node);
  if (node.type === 'DIRECTORY') {
    await mapAsync(node.childPath, (node) => iteratePathTree(node, f));
  }
};

export const buildPathTree = async (path: string): Promise<PathNode> => {
  return {
    type: 'DIRECTORY',
    path,
    childPath: await makePathNode(path),
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
        const childPath = await makePathNode(namePath);
        return {
          type: 'DIRECTORY' as const,
          path: namePath,
          childPath,
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
