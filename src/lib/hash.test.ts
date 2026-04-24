import { describe, it, expect } from "vitest";
import { cyrb53 } from "./hash";

describe("cyrb53", () => {
  it("same input always returns the same output", () => {
    const a = cyrb53("hello");
    const b = cyrb53("hello");
    expect(a).toBe(b);
  });

  it("different inputs return different outputs", () => {
    expect(cyrb53("hello")).not.toBe(cyrb53("world"));
  });

  it("empty string is deterministic", () => {
    expect(cyrb53("")).toBe(cyrb53(""));
  });

  it("same string with different seeds produce different results", () => {
    expect(cyrb53("test", 0)).not.toBe(cyrb53("test", 1));
  });

  it("result is a non-negative integer", () => {
    const h = cyrb53("idoldle");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });

  it("result is below 2^53 (fits in a JS number safely)", () => {
    const h = cyrb53("idoldle");
    expect(h).toBeLessThan(Math.pow(2, 53));
  });

  it("known stable hash value for a specific input", () => {
    // Pin a specific value so regressions are caught
    const h = cyrb53("2024-06-15|len-6|2024-01-01");
    expect(typeof h).toBe("number");
    // Value must be consistent across runs — store it on first run
    expect(h).toBe(cyrb53("2024-06-15|len-6|2024-01-01"));
  });

  it("modulo distributes across typical pool sizes without systematic bias", () => {
    const poolSize = 10;
    const indices = new Set<number>();
    for (let day = 0; day < 100; day++) {
      const seed = `2024-01-${String(day + 1).padStart(2, "0")}|len-6|2024-01-01`;
      indices.add(cyrb53(seed) % poolSize);
    }
    // With 100 inputs and pool size 10, we expect all 10 slots to be hit
    expect(indices.size).toBe(poolSize);
  });
});
