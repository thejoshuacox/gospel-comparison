import { describe, expect, it, vi } from "vitest";
import * as compare from "@/lib/compare";
import * as events from "@/lib/events";
import * as bibleApi from "@/lib/bible-api";

describe("compare payload", () => {
  it("returns null for unknown event", async () => {
    const payload = await compare.getComparePayload("missing", "web");
    expect(payload).toBeNull();
  });

  it("handles partial passage failures", async () => {
    vi.spyOn(events, "getEventById").mockReturnValue({
      id: "x",
      section: "Gospel Narrative",
      title: "Sample",
      order: 1,
      references: {
        matthew: "1:1",
        mark: null,
        luke: null,
        john: null,
      },
      source: {
        sourceUrl: "https://example.com",
        importedAt: "2026-03-03T00:00:00.000Z",
        parserVersion: "1.0.0",
      },
    });

    vi.spyOn(bibleApi, "getPassage").mockRejectedValueOnce(new Error("boom"));

    const payload = await compare.getComparePayload("x", "web");

    expect(payload).not.toBeNull();
    expect(payload?.columns.find((c) => c.gospel === "matthew")?.status).toBe("error");
  });
});

