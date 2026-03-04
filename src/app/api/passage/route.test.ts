import { describe, expect, it, vi } from "vitest";
import * as bibleApi from "@/lib/bible-api";
import { GET } from "@/app/api/passage/route";

describe("GET /api/passage", () => {
  it("returns 400 when ref is missing", async () => {
    const response = await GET(new Request("http://localhost/api/passage"));
    expect(response.status).toBe(400);
  });

  it("returns normalized passage", async () => {
    vi.spyOn(bibleApi, "getPassage").mockResolvedValueOnce({
      reference: "John 1:1",
      translation: "web",
      text: "In the beginning was the Word.",
      verses: [],
    });

    const response = await GET(
      new Request("http://localhost/api/passage?ref=John%201:1&translation=web"),
    );
    const json = (await response.json()) as { reference: string };

    expect(response.status).toBe(200);
    expect(json.reference).toBe("John 1:1");
  });
});
