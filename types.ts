export interface MarkdownMetaData {
  title: string;
  subtitle?: string;
  date?: Date;
}

export interface PostData {
  pathArr: string[];
  content: string;
  metaData: MarkdownMetaData;
  /** index.json 미포함 */
  path: string;
}
