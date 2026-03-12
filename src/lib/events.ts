import { z } from "zod";
import { GOSPEL_KEYS, type GospelEvent } from "@/types/gospel";
import { SOURCE_URL, PARSER_VERSION } from "@/lib/constants";
import eventsJson from "../../data/gospel-events.json";
import manualEventsJson from "../../data/gospel-events.manual.json";
import { mergeEvents, parseManualEventsFile } from "@/lib/manual-events";

const gospelRefsSchema = z.object({
  matthew: z.string().nullable(),
  mark: z.string().nullable(),
  luke: z.string().nullable(),
  john: z.string().nullable(),
});

const gospelEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string().nullable(),
  order: z.number().int().positive(),
  references: gospelRefsSchema,
});

const eventsSchema = z.array(gospelEventSchema);

const fallbackData: GospelEvent[] = [];

const parsed = eventsSchema.safeParse(eventsJson ?? fallbackData);
const manualFile = parseManualEventsFile(manualEventsJson);

const DATASET = parsed.success ? mergeEvents(parsed.data, manualFile) : fallbackData;

export type EventQuery = {
  q?: string;
  limit?: number;
  offset?: number;
};

export function listEvents(query: EventQuery = {}): { total: number; items: GospelEvent[] } {
  let rows = [...DATASET];

  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((event) => {
      if (event.title.toLowerCase().includes(q)) {
        return true;
      }

      if (event.location?.toLowerCase().includes(q)) {
        return true;
      }

      return GOSPEL_KEYS.some((key) => event.references[key]?.toLowerCase().includes(q));
    });
  }

  const total = rows.length;
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(200, Math.max(1, query.limit ?? 50));

  return {
    total,
    items: rows.slice(offset, offset + limit),
  };
}

export function getEventById(id: string): GospelEvent | undefined {
  return DATASET.find((event) => event.id === id);
}

export function sourceInfo(): {
  sourceUrl: string;
  parserVersion: string;
  importedDataPath: string;
  manualOverlayPath: string;
} {
  return {
    sourceUrl: SOURCE_URL,
    parserVersion: PARSER_VERSION,
    importedDataPath: "data/gospel-events.json",
    manualOverlayPath: "data/gospel-events.manual.json",
  };
}

export function hasData(): boolean {
  return DATASET.length > 0;
}

