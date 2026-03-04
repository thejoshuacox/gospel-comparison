import { describe, expect, it, vi } from "vitest";
import * as compare from "@/lib/compare";
import { GET } from "@/app/api/compare/[id]/route";

describe("GET /api/compare/:id", () => {
  it("returns 404 for missing event", async () => {
    vi.spyOn(compare, "getComparePayload").mockResolvedValueOnce(null);
    const response = await GET(new Request("http://localhost/api/compare/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });
});
