import { z } from "zod";
import type {
  GospelEvent,
  GospelEventAddition,
  GospelEventOverride,
  GospelRefs,
  ManualEventsFile,
} from "@/types/gospel";

const gospelRefsSchema = z.object({
  matthew: z.string().nullable(),
  mark: z.string().nullable(),
  luke: z.string().nullable(),
  john: z.string().nullable(),
});

const gospelRefsPatchSchema = gospelRefsSchema.partial();

const overrideSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  location: z.string().nullable().optional(),
  references: gospelRefsPatchSchema.optional(),
  hidden: z.boolean().optional(),
  notes: z.string().optional(),
});

const additionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string().nullable(),
  references: gospelRefsSchema,
  insertAfterId: z.string().min(1).optional(),
  insertBeforeId: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const manualEventsSchema = z.object({
  overrides: z.array(overrideSchema).default([]),
  additions: z.array(additionSchema).default([]),
});

export function parseManualEventsFile(input: unknown): ManualEventsFile {
  const parsed = manualEventsSchema.safeParse(input);
  if (!parsed.success) {
    return { overrides: [], additions: [] };
  }

  return parsed.data;
}

function mergeReferences(base: GospelRefs, patch?: Partial<GospelRefs>): GospelRefs {
  return {
    matthew: patch?.matthew === undefined ? base.matthew : patch.matthew,
    mark: patch?.mark === undefined ? base.mark : patch.mark,
    luke: patch?.luke === undefined ? base.luke : patch.luke,
    john: patch?.john === undefined ? base.john : patch.john,
  };
}

function applyOverride(event: GospelEvent, override: GospelEventOverride): GospelEvent {
  return {
    ...event,
    title: override.title ?? event.title,
    location: override.location === undefined ? event.location : override.location,
    references: mergeReferences(event.references, override.references),
  };
}

function toEvent(addition: GospelEventAddition): GospelEvent {
  return {
    id: addition.id,
    title: addition.title,
    location: addition.location,
    references: addition.references,
    order: 0,
  };
}

export function mergeEvents(baseEvents: GospelEvent[], manualFile: ManualEventsFile): GospelEvent[] {
  const overridesById = new Map(manualFile.overrides.map((item) => [item.id, item]));
  const sequence: GospelEvent[] = [];
  const knownIds = new Set<string>();

  for (const event of baseEvents) {
    const override = overridesById.get(event.id);
    if (override?.hidden) {
      knownIds.add(event.id);
      continue;
    }

    const merged = override ? applyOverride(event, override) : event;
    sequence.push(merged);
    knownIds.add(event.id);
  }

  const pendingAppend: GospelEvent[] = [];

  for (const addition of manualFile.additions) {
    if (knownIds.has(addition.id)) {
      continue;
    }

    const nextEvent = toEvent(addition);
    const beforeIndex =
      addition.insertBeforeId !== undefined
        ? sequence.findIndex((event) => event.id === addition.insertBeforeId)
        : -1;
    const afterIndex =
      addition.insertAfterId !== undefined
        ? sequence.findIndex((event) => event.id === addition.insertAfterId)
        : -1;

    if (beforeIndex >= 0) {
      sequence.splice(beforeIndex, 0, nextEvent);
    } else if (afterIndex >= 0) {
      sequence.splice(afterIndex + 1, 0, nextEvent);
    } else {
      pendingAppend.push(nextEvent);
    }

    knownIds.add(addition.id);
  }

  const merged = [...sequence, ...pendingAppend];

  return merged.map((event, index) => ({
    ...event,
    order: index + 1,
  }));
}
