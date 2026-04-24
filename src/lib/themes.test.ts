import { describe, it, expect } from "vitest";
import {
  resolveThemeKey,
  resolveLength,
  THEME_BY_DOW,
  THEME_LABEL,
  THEME_FALLBACK,
  THEME_LENGTH,
} from "./themes";
import type { ThemeKey, WordLength } from "../types";
import { SUPPORTED_LENGTHS } from "../types";

const ALL_KEYS: ThemeKey[] = [
  "len-4", "len-5", "len-6", "len-7",
  "len-8", "long-name",
];

describe("resolveThemeKey", () => {
  // UTC mapping: Sun=len-5, Mon=len-4, Tue=len-5, Wed=len-6, Thu=len-7, Fri=len-8, Sat=long-name
  it("Sunday (UTC DOW 0) → len-5 (bonus canonical Wordle length)", () => {
    expect(resolveThemeKey("2024-06-16")).toBe("len-5");
  });

  it("Monday (UTC DOW 1) → len-4", () => {
    expect(resolveThemeKey("2024-06-17")).toBe("len-4");
  });

  it("Tuesday (UTC DOW 2) → len-5", () => {
    expect(resolveThemeKey("2024-06-18")).toBe("len-5");
  });

  it("Wednesday (UTC DOW 3) → len-6", () => {
    expect(resolveThemeKey("2024-06-19")).toBe("len-6");
  });

  it("Thursday (UTC DOW 4) → len-7", () => {
    expect(resolveThemeKey("2024-06-20")).toBe("len-7");
  });

  it("Friday (UTC DOW 5) → len-8", () => {
    expect(resolveThemeKey("2024-06-21")).toBe("len-8");
  });

  it("Saturday (UTC DOW 6) → long-name (mixed 9-10)", () => {
    expect(resolveThemeKey("2024-06-22")).toBe("long-name");
  });

  it("is not affected by local timezone (uses UTC)", () => {
    expect(resolveThemeKey("2024-06-16")).toBe("len-5");
    expect(resolveThemeKey("2024-06-17")).toBe("len-4");
  });
});

describe("THEME_BY_DOW", () => {
  it("covers all 7 days of the week", () => {
    for (let dow = 0; dow <= 6; dow++) {
      expect(THEME_BY_DOW[dow]).toBeDefined();
    }
  });

  it("all values are valid ThemeKeys", () => {
    for (const key of Object.values(THEME_BY_DOW)) {
      expect(ALL_KEYS).toContain(key);
    }
  });
});

describe("THEME_LABEL", () => {
  it("has a label for every ThemeKey", () => {
    for (const key of ALL_KEYS) {
      expect(THEME_LABEL[key]).toBeTruthy();
    }
  });
});

describe("THEME_FALLBACK", () => {
  it("fallback targets are valid ThemeKeys", () => {
    for (const target of Object.values(THEME_FALLBACK)) {
      expect(ALL_KEYS).toContain(target);
    }
  });

  it("is empty (no cross-length fallback permitted)", () => {
    // With variable word lengths, no theme can safely fall back to another
    // theme. Each pool must be natively large enough.
    expect(Object.keys(THEME_FALLBACK).length).toBe(0);
  });
});

describe("THEME_LENGTH", () => {
  it("has a length for every fixed-length ThemeKey", () => {
    const fixedKeys: ThemeKey[] = [
      "len-4", "len-5", "len-6", "len-7", "len-8",
    ];
    for (const key of fixedKeys) {
      expect(THEME_LENGTH[key]).toBeDefined();
    }
  });

  it("long-name is intentionally absent (mixed-length theme)", () => {
    expect(THEME_LENGTH["long-name"]).toBeUndefined();
  });

  it("all defined values are in SUPPORTED_LENGTHS", () => {
    const supported: readonly WordLength[] = SUPPORTED_LENGTHS;
    for (const len of Object.values(THEME_LENGTH)) {
      if (len !== undefined) expect(supported).toContain(len);
    }
  });

  it("matches the expected day-of-week length map", () => {
    expect(THEME_LENGTH["len-4"]).toBe(4);
    expect(THEME_LENGTH["len-5"]).toBe(5);
    expect(THEME_LENGTH["len-6"]).toBe(6);
    expect(THEME_LENGTH["len-7"]).toBe(7);
    expect(THEME_LENGTH["len-8"]).toBe(8);
  });
});

describe("resolveLength", () => {
  // UTC mapping: Sun=len-5, Mon=len-4, Tue=len-5, Wed=len-6, Thu=len-7, Fri=len-8, Sat=long-name
  it("Sunday → 5 (bonus canonical)", () => {
    expect(resolveLength("2024-06-16")).toBe(5);
  });
  it("Monday → 4", () => {
    expect(resolveLength("2024-06-17")).toBe(4);
  });
  it("Tuesday → 5", () => {
    expect(resolveLength("2024-06-18")).toBe(5);
  });
  it("Wednesday → 6", () => {
    expect(resolveLength("2024-06-19")).toBe(6);
  });
  it("Thursday → 7", () => {
    expect(resolveLength("2024-06-20")).toBe(7);
  });
  it("Friday → 8", () => {
    expect(resolveLength("2024-06-21")).toBe(8);
  });
  it("Saturday → null (mixed long-name, derived at runtime)", () => {
    expect(resolveLength("2024-06-22")).toBe(null);
  });
});
