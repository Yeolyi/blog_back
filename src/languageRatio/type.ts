export interface Language {
  language: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface CodeMetadata {
  extension: string;
  bytes: number;
}
