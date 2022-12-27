export interface PostData {
  content: string;
  metaData: PostMetadata;
  parents: ParentPost[];
}

export interface PostMetadata {
  title: string;
  lastModified?: string;
  created?: string;
  // https://stackoverflow.com/a/5525820
  headers: { [title: string]: PostHeader };
}

export interface PostHeader {
  level: 2 | 3;
  id: number;
}

export interface ParentPost {
  title: string;
  path: string;
}
