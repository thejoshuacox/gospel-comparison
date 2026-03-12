export const GOSPEL_KEYS = ["matthew", "mark", "luke", "john"] as const;

export type GospelKey = (typeof GOSPEL_KEYS)[number];

export type GospelRefs = Record<GospelKey, string | null>;

export type GospelEvent = {
  id: string;
  title: string;
  location: string | null;
  order: number;
  references: GospelRefs;
};

export type GospelEventOverride = {
  id: string;
  title?: string;
  location?: string | null;
  references?: Partial<GospelRefs>;
  hidden?: boolean;
  notes?: string;
};

export type GospelEventAddition = {
  id: string;
  title: string;
  location: string | null;
  references: GospelRefs;
  insertAfterId?: string;
  insertBeforeId?: string;
  notes?: string;
};

export type ManualEventsFile = {
  overrides: GospelEventOverride[];
  additions: GospelEventAddition[];
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

