export type MultiChapterReference = {
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

const MULTI_CHAPTER_PATTERN =
  /^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)-(\d+):(\d+)$/;

export function parseMultiChapterReference(
  reference: string | null | undefined,
): MultiChapterReference | null {
  if (!reference) {
    return null;
  }

  const cleaned = reference.replace(/[\[\]]/g, "").trim();
  const match = cleaned.match(MULTI_CHAPTER_PATTERN);
  if (!match) {
    return null;
  }

  const startChapter = Number(match[2]);
  const startVerse = Number(match[3]);
  const endChapter = Number(match[4]);
  const endVerse = Number(match[5]);

  if (Number.isNaN(startChapter) || Number.isNaN(endChapter)) {
    return null;
  }

  if (endChapter <= startChapter) {
    return null;
  }

  return {
    book: match[1].replace(/\s+/g, " ").trim(),
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  };
}
