import { describe, expect, it } from "vitest";
import { cleanReference, slugify, toCanonicalReference } from "@/lib/references";

describe("reference utilities", () => {
  it("normalizes references", () => {
    expect(cleanReference(" [16:9-11] ")).toBe("16:9-11");
    expect(cleanReference("N/A")).toBe("");
  });

  it("creates canonical references", () => {
    expect(toCanonicalReference("matthew", "3:13-17")).toBe("Matthew 3:13-17");
    expect(toCanonicalReference("john", "")).toBeNull();
  });

  it("slugifies titles", () => {
    expect(slugify("Baptism of Jesus")).toBe("baptism-of-jesus");
  });
});

