export interface MarkdownMetaData {
  title: string;
  subtitle?: string;
  date?: Date;
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
