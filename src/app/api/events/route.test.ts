import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/events/route";

describe("GET /api/events", () => {
  it("returns paginated event list", async () => {
    const request = new Request("http://localhost/api/events?limit=5&offset=0");
    const response = await GET(request);
    const json = (await response.json()) as { total: number; items: unknown[] };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.items.length).toBeLessThanOrEqual(5);
    expect(json.total).toBeGreaterThan(0);
  });
});
