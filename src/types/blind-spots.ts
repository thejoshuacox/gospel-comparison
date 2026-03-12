import type { GospelKey } from "@/types/gospel";

export type MissingRange = {
  startVerse: number;
  endVerse: number;
  count: number;
};

export type ChapterBlindSpot = {
  chapter: number;
  verseCount: number;
  missingRanges: MissingRange[];
};

export type BlindSpotSummary = {
  gospel: GospelKey;
  totalVerses: number;
  coveredVerses: number;
  coveragePercent: number;
  missingVerses: number;
  chaptersWithGaps: number;
};

export type BlindSpotsReport = {
  generatedAt: string;
  source: string;
  summaries: BlindSpotSummary[];
  detail: Record<GospelKey, ChapterBlindSpot[]>;
};

export type GapItem = {
  id: string;
  gospel: GospelKey;
  chapter: number;
  startVerse: number;
  endVerse: number;
  count: number;
};

export type GapAssignment = {
  category: string;
  status: "todo" | "done";
  notes: string;
};
