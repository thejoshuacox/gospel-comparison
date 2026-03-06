import { describe, expect, it } from "vitest";
import { filterEventsByIncludeExclude, sortEvents } from "@/lib/event-selection";
import type { GospelEvent } from "@/types/gospel";

const baseSource = {
  sourceUrl: "https://example.com",
  importedAt: "2026-03-04T00:00:00.000Z",
  parserVersion: "1.0.0",
};

const events: GospelEvent[] = [
  {
    id: "a",
    section: "s",
    title: "A",
    order: 1,
    references: { matthew: "4:1", mark: "1:1", luke: "3:1", john: "1:1" },
    source: baseSource,
  },
  {
    id: "b",
    section: "s",
    title: "B",
    order: 2,
    references: { matthew: "5:1", mark: null, luke: "4:1", john: null },
    source: baseSource,
  },
  {
    id: "c",
    section: "s",
    title: "C",
    order: 3,
    references: { matthew: null, mark: null, luke: "2:1", john: null },
    source: baseSource,
  },
  {
    id: "d",
    section: "s",
    title: "D",
    order: 4,
    references: { matthew: null, mark: "2:1", luke: null, john: null },
    source: baseSource,
  },
];

describe("event selection", () => {
  it("includes events that occur in any checked gospel", () => {
    const filtered = filterEventsByIncludeExclude(events, ["luke"], []);
    expect(filtered.map((event) => event.id)).toEqual(["a", "b", "c"]);
  });

  it("excludes events that occur in an excluded gospel", () => {
    const filtered = filterEventsByIncludeExclude(events, ["luke"], ["matthew"]);
    expect(filtered.map((event) => event.id)).toEqual(["c"]);
  });

  it("shows all when no includes are selected, except excluded", () => {
    const filtered = filterEventsByIncludeExclude(events, [], ["john"]);
    expect(filtered.map((event) => event.id)).toEqual(["b", "c", "d"]);
  });

  it("sorts by chosen gospel reference order", () => {
    const sorted = sortEvents(events, "lukan");
    expect(sorted.map((event) => event.id)).toEqual(["c", "d", "a", "b"]);
  });

  it("keeps selected-gospel events ordered even when mixed with non-selected events", () => {
    const sorted = sortEvents(events, "markan");
    expect(sorted.map((event) => event.id)).toEqual(["a", "b", "c", "d"]);
  });
});
