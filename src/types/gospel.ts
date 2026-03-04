export const GOSPEL_KEYS = ["matthew", "mark", "luke", "john"] as const;

export type GospelKey = (typeof GOSPEL_KEYS)[number];

export type GospelRefs = Record<GospelKey, string | null>;

export type SourceMeta = {
  sourceUrl: string;
  importedAt: string;
  parserVersion: string;
};

export type GospelEvent = {
  id: string;
  section: string;
  title: string;
  order: number;
  references: GospelRefs;
  source: SourceMeta;
};

export type PassageVerse = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type PassagePayload = {
  reference: string;
  translation: string;
  verses: PassageVerse[];
  text: string;
};

export type CompareColumn = {
  gospel: GospelKey;
  reference: string | null;
  status: "ok" | "missing" | "error";
  passage: PassagePayload | null;
  error: string | null;
};

export type ComparePayload = {
  event: GospelEvent;
  translation: string;
  columns: CompareColumn[];
};

