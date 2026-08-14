import { describe, expect, it } from "vitest";
import { formatCount, formatDateKey } from "./format";

describe("formatDateKey", () => {
  it("formats valid UTC date keys for people", () => {
    const formatted = formatDateKey("2024-06-15");
    expect(formatted).toContain("2024");
    expect(formatted).toMatch(/Jun|06/);
    expect(formatted).toMatch(/15/);
  });

  it("returns malformed date keys unchanged", () => {
    expect(formatDateKey("not-a-date")).toBe("not-a-date");
    expect(formatDateKey("2024-99-99")).toBe("2024-99-99");
  });
});

describe("formatCount", () => {
  it("formats a count with the active locale", () => {
    expect(formatCount(1234567)).toBe(new Intl.NumberFormat().format(1234567));
  });
});
