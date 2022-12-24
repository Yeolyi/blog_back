export interface CommitDiff {
  hash: string;
  message: string;
  added: number;
  colors: { language: string }[];
  date: string;
}

export interface CommitWithChangedFiles {
  hash: string;
  message: string;
  date: string;
  files: ChangedFile[];
}

export interface ChangedFile {
  addedLinesCnt: number;
  deletedLinesCnt: number;
  filePath: string;
}
