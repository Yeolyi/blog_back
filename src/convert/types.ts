export interface MarkdownMetaData {
  title: string;
  subtitle?: string;
  lastModified?: string;
}

export interface PostData {
  content: string;
  metaData: MarkdownMetaData;
  parents: ParentPost[];
}

export interface ParentPost {
  title: string;
  path: string;
}
