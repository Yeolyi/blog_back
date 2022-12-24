export interface MarkdownMetaData {
  title: string;
  subtitle?: string;
  date?: Date;
}

export interface PostData {
  content: string;
  metaData: MarkdownMetaData;
}
