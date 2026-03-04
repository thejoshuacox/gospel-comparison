import { z } from "zod";
import { GOSPEL_KEYS, type GospelEvent } from "@/types/gospel";
import { SOURCE_URL, PARSER_VERSION } from "@/lib/constants";
import eventsJson from "../../data/gospel-events.json";

const gospelRefsSchema = z.object({
  matthew: z.string().nullable(),
  mark: z.string().nullable(),
  luke: z.string().nullable(),
  john: z.string().nullable(),
});

const sourceSchema = z.object({
  sourceUrl: z.string().url(),
  importedAt: z.string(),
  parserVersion: z.string(),
});

const gospelEventSchema = z.object({
  id: z.string().min(1),
  section: z.string(),
  title: z.string().min(1),
  order: z.number().int().positive(),
  references: gospelRefsSchema,
  source: sourceSchema,
});

const eventsSchema = z.array(gospelEventSchema);

const fallbackData: GospelEvent[] = [];

const parsed = eventsSchema.safeParse(eventsJson ?? fallbackData);

const DATASET = parsed.success ? parsed.data : fallbackData;

export type EventQuery = {
  q?: string;
  section?: string;
  limit?: number;
  offset?: number;
};

export function listSections(): string[] {
  return [...new Set(DATASET.map((event) => event.section).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function listEvents(query: EventQuery = {}): { total: number; items: GospelEvent[] } {
  let rows = [...DATASET];

  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((event) => {
      if (event.title.toLowerCase().includes(q)) {
        return true;
      }

      return GOSPEL_KEYS.some((key) => event.references[key]?.toLowerCase().includes(q));
    });
  }

  if (query.section) {
    rows = rows.filter((event) => event.section.toLowerCase() === query.section?.toLowerCase());
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

export function sourceInfo(): { sourceUrl: string; parserVersion: string } {
  return {
    sourceUrl: SOURCE_URL,
    parserVersion: PARSER_VERSION,
  };
}

export function hasData(): boolean {
  return DATASET.length > 0;
}

