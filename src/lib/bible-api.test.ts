import { beforeEach, describe, expect, it, vi } from "vitest";
import { coerceTranslation, getPassage } from "@/lib/bible-api";

describe("bible-api adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("coerces unsupported translations to default", () => {
    expect(coerceTranslation("kjv")).toBe("kjv");
    expect(coerceTranslation("bad")).toBe("web");
  });

  it("maps upstream payload", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reference: "John 1:1",
          text: "In the beginning was the Word.",
          verses: [
            {
              book_id: "JHN",
              book_name: "John",
              chapter: 1,
              verse: 1,
              text: "In the beginning was the Word.",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const passage = await getPassage("John 1:1", "web");

    expect(passage.reference).toBe("John 1:1");
    expect(passage.verses[0].bookName).toBe("John");
  });
});

