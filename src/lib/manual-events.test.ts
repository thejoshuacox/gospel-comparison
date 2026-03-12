import { describe, expect, it } from "vitest";
import { mergeEvents } from "@/lib/manual-events";
import type { GospelEvent, ManualEventsFile } from "@/types/gospel";

const baseEvents: GospelEvent[] = [
  {
    id: "a",
    title: "A",
    location: "Loc A",
    order: 1,
    references: { matthew: "1:1", mark: null, luke: null, john: null },
  },
  {
    id: "b",
    title: "B",
    location: "Loc B",
    order: 2,
    references: { matthew: null, mark: "2:1", luke: null, john: null },
  },
];

describe("manual event overlay", () => {
  it("applies overrides and additions while recomputing order", () => {
    const manual: ManualEventsFile = {
      overrides: [
        {
          id: "a",
          title: "A updated",
          references: {
            luke: "3:1",
          },
        },
      ],
      additions: [
        {
          id: "c",
          title: "C",
          location: "Loc C",
          insertAfterId: "a",
          references: {
            matthew: null,
            mark: null,
            luke: "4:1-10",
            john: null,
          },
        },
      ],
    };

    const merged = mergeEvents(baseEvents, manual);

    expect(merged.map((event) => event.id)).toEqual(["a", "c", "b"]);
    expect(merged[0].title).toBe("A updated");
    expect(merged[0].references.luke).toBe("3:1");
    expect(merged.map((event) => event.order)).toEqual([1, 2, 3]);
  });
});
