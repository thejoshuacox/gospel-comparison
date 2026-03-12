import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeEvents, parseManualEventsFile } from "../src/lib/manual-events";
import type { GospelEvent } from "../src/types/gospel";

type GospelKey = "matthew" | "mark" | "luke" | "john";

type Segment = {
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

type MissingRange = {
  startVerse: number;
  endVerse: number;
  count: number;
};

type ChapterBlindSpot = {
  chapter: number;
  verseCount: number;
  missingRanges: MissingRange[];
};

type GospelBlindSpotSummary = {
  gospel: GospelKey;
  totalVerses: number;
  coveredVerses: number;
  coveragePercent: number;
  missingVerses: number;
  chaptersWithGaps: number;
};

const GOSPELS: Array<{ key: GospelKey; bookName: string; chapters: number }> = [
  { key: "matthew", bookName: "Matthew", chapters: 28 },
  { key: "mark", bookName: "Mark", chapters: 16 },
  { key: "luke", bookName: "Luke", chapters: 24 },
  { key: "john", bookName: "John", chapters: 21 },
];

const CHAPTER_VERSE_COUNTS: Record<GospelKey, number[]> = {
  matthew: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20],
  mark: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
  luke: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53],
  john: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25],
};

function cleanRef(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/[\[\]\s]/g, "");
}

function parseReferenceSegments(reference: string): Segment[] {
  const normalized = cleanRef(reference);
  if (!normalized) return [];

  const pieces = normalized.split(",");
  const segments: Segment[] = [];
  let currentChapter: number | null = null;

  for (const piece of pieces) {
    let match = piece.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
    if (match) {
      const startChapter = Number(match[1]);
      const startVerse = Number(match[2]);
      const endChapter = Number(match[3]);
      const endVerse = Number(match[4]);
      currentChapter = endChapter;
      segments.push({ startChapter, startVerse, endChapter, endVerse });
      continue;
    }

    match = piece.match(/^(\d+):(\d+)-(\d+)$/);
    if (match) {
      const chapter = Number(match[1]);
      const startVerse = Number(match[2]);
      const endVerse = Number(match[3]);
      currentChapter = chapter;
      segments.push({ startChapter: chapter, startVerse, endChapter: chapter, endVerse });
      continue;
    }

    match = piece.match(/^(\d+):(\d+)$/);
    if (match) {
      const chapter = Number(match[1]);
      const verse = Number(match[2]);
      currentChapter = chapter;
      segments.push({ startChapter: chapter, startVerse: verse, endChapter: chapter, endVerse: verse });
      continue;
    }

    match = piece.match(/^(\d+)-(\d+)$/);
    if (match && currentChapter !== null) {
      const startVerse = Number(match[1]);
      const endVerse = Number(match[2]);
      segments.push({
        startChapter: currentChapter,
        startVerse,
        endChapter: currentChapter,
        endVerse,
      });
      continue;
    }

    match = piece.match(/^(\d+)$/);
    if (match && currentChapter !== null) {
      const verse = Number(match[1]);
      segments.push({
        startChapter: currentChapter,
        startVerse: verse,
        endChapter: currentChapter,
        endVerse: verse,
      });
      continue;
    }
  }

  return segments;
}

function rangesFromMissing(covered: Set<number>, verseCount: number): MissingRange[] {
  const missing: MissingRange[] = [];
  let start: number | null = null;

  for (let verse = 1; verse <= verseCount; verse += 1) {
    const isCovered = covered.has(verse);
    if (!isCovered && start === null) {
      start = verse;
    }
    if (isCovered && start !== null) {
      missing.push({ startVerse: start, endVerse: verse - 1, count: verse - start });
      start = null;
    }
  }

  if (start !== null) {
    missing.push({ startVerse: start, endVerse: verseCount, count: verseCount - start + 1 });
  }

  return missing;
}

function toMarkdownSummary(
  summaries: GospelBlindSpotSummary[],
  details: Record<GospelKey, ChapterBlindSpot[]>,
): string {
  const lines: string[] = [];
  lines.push("# Blind Spots Report");
  lines.push("");
  lines.push("## Coverage Summary");
  lines.push("");
  lines.push("| Gospel | Covered | Total | Coverage | Missing | Chapters With Gaps |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const summary of summaries) {
    lines.push(
      `| ${summary.gospel} | ${summary.coveredVerses} | ${summary.totalVerses} | ${summary.coveragePercent.toFixed(2)}% | ${summary.missingVerses} | ${summary.chaptersWithGaps} |`,
    );
  }

  lines.push("");
  lines.push("## Missing Ranges By Gospel");
  lines.push("");
  for (const summary of summaries) {
    lines.push(`### ${summary.gospel}`);
    const chapters = details[summary.gospel].filter((chapter) => chapter.missingRanges.length > 0);
    if (chapters.length === 0) {
      lines.push("- No gaps detected.");
      lines.push("");
      continue;
    }
    for (const chapter of chapters) {
      const ranges = chapter.missingRanges
        .map((range) => `${chapter.chapter}:${range.startVerse}-${range.endVerse}`)
        .join(", ");
      lines.push(`- ${ranges}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function run(): Promise<void> {
  const importedDataPath = path.join(process.cwd(), "data", "gospel-events.json");
  const manualDataPath = path.join(process.cwd(), "data", "gospel-events.manual.json");
  const raw = await readFile(importedDataPath, "utf8");
  const importedEvents = JSON.parse(raw) as GospelEvent[];
  const manualRaw = await readFile(manualDataPath, "utf8");
  const manualFile = parseManualEventsFile(JSON.parse(manualRaw));
  const events = mergeEvents(importedEvents, manualFile);

  const chapterVerseCounts: Record<GospelKey, number[]> = {
    matthew: [...CHAPTER_VERSE_COUNTS.matthew],
    mark: [...CHAPTER_VERSE_COUNTS.mark],
    luke: [...CHAPTER_VERSE_COUNTS.luke],
    john: [...CHAPTER_VERSE_COUNTS.john],
  };

  const coverage: Record<GospelKey, Array<Set<number>>> = {
    matthew: chapterVerseCounts.matthew.map(() => new Set<number>()),
    mark: chapterVerseCounts.mark.map(() => new Set<number>()),
    luke: chapterVerseCounts.luke.map(() => new Set<number>()),
    john: chapterVerseCounts.john.map(() => new Set<number>()),
  };

  for (const event of events) {
    for (const gospel of GOSPELS) {
      const rawRef = event.references[gospel.key];
      const segments = parseReferenceSegments(rawRef ?? "");
      const verseCounts = chapterVerseCounts[gospel.key];
      const chapterCoverage = coverage[gospel.key];

      for (const segment of segments) {
        const startChapter = Math.max(1, segment.startChapter);
        const endChapter = Math.min(verseCounts.length, segment.endChapter);
        if (startChapter > endChapter) {
          continue;
        }

        for (let chapter = startChapter; chapter <= endChapter; chapter += 1) {
          const chapterMax = verseCounts[chapter - 1];
          if (!chapterMax) continue;

          const startVerse = chapter === startChapter ? segment.startVerse : 1;
          const endVerse = chapter === endChapter ? segment.endVerse : chapterMax;
          const boundedStart = Math.max(1, Math.min(startVerse, chapterMax));
          const boundedEnd = Math.max(1, Math.min(endVerse, chapterMax));
          const finalStart = Math.min(boundedStart, boundedEnd);
          const finalEnd = Math.max(boundedStart, boundedEnd);

          for (let verse = finalStart; verse <= finalEnd; verse += 1) {
            chapterCoverage[chapter - 1].add(verse);
          }
        }
      }
    }
  }

  const detail: Record<GospelKey, ChapterBlindSpot[]> = {
    matthew: [],
    mark: [],
    luke: [],
    john: [],
  };

  const summaries: GospelBlindSpotSummary[] = [];

  for (const gospel of GOSPELS) {
    const counts = chapterVerseCounts[gospel.key];
    const chapterCoverage = coverage[gospel.key];
    let totalVerses = 0;
    let coveredVerses = 0;
    let chaptersWithGaps = 0;

    for (let chapterIndex = 0; chapterIndex < counts.length; chapterIndex += 1) {
      const verseCount = counts[chapterIndex];
      totalVerses += verseCount;
      coveredVerses += chapterCoverage[chapterIndex].size;
      const missingRanges = rangesFromMissing(chapterCoverage[chapterIndex], verseCount);
      if (missingRanges.length > 0) {
        chaptersWithGaps += 1;
      }
      detail[gospel.key].push({
        chapter: chapterIndex + 1,
        verseCount,
        missingRanges,
      });
    }

    const missingVerses = totalVerses - coveredVerses;
    const coveragePercent = totalVerses === 0 ? 0 : (coveredVerses / totalVerses) * 100;
    summaries.push({
      gospel: gospel.key,
      totalVerses,
      coveredVerses,
      coveragePercent,
      missingVerses,
      chaptersWithGaps,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: "merged(data/gospel-events.json + data/gospel-events.manual.json)",
    summaries,
    detail,
  };

  const jsonPath = path.join(process.cwd(), "data", "blind-spots-report.json");
  const mdPath = path.join(process.cwd(), "data", "blind-spots-report.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(mdPath, toMarkdownSummary(summaries, detail), "utf8");

  process.stdout.write(`Blind spot report written:\n- ${jsonPath}\n- ${mdPath}\n`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
