export interface ExampleWord {
  written: string;
  reading: string;
  meaning: string;
}

export interface KanjiEntry {
  kanji: string;
  unicode: string;
  jlpt: number;
  strokeCount: number;
  meanings: string[];
  onReadings: string[];
  kunReadings: string[];
  grade: number | null;
  words: ExampleWord[];
  svg: string;
}
