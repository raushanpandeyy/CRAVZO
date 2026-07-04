import { describe, it, expect } from "vitest";
import { buildCacheKey } from "../utils/cache.js";

describe("Cache utilities", () => {
  it("should build cache key with sorted params", () => {
    const key = buildCacheKey("restaurants:list", { city: "Delhi", cuisine: "Indian" });
    expect(key).toContain("restaurants:list");
    expect(key).toContain("city=delhi");
    expect(key).toContain("cuisine=indian");
  });

  it("should handle empty params", () => {
    const key = buildCacheKey("restaurants:nearby");
    expect(key).toBe("restaurants:nearby");
  });

  it("should normalize and sort params", () => {
    const key = buildCacheKey("test", { b: "2", a: "1" });
    expect(key.indexOf("a=1")).toBeLessThan(key.indexOf("b=2"));
  });
});
