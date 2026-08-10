import { describe, expect, it } from "vitest";
import { ENGLISH_STRINGS, LOCALE_STRESS_FIXTURES, pseudoLocalize } from "./strings";

describe("ECW string catalog", () => {
  it("keeps source labels naturally cased and expandable", () => {
    expect(ENGLISH_STRINGS.navigation.display).toBe("Display");
    expect(pseudoLocalize(ENGLISH_STRINGS.navigation.display, 3)).toMatch(/^⟦.*⟧$/);
    expect(LOCALE_STRESS_FIXTURES.germanCompound.length).toBeGreaterThan(40);
  });

  it("includes bidirectional and script stress fixtures", () => {
    expect(LOCALE_STRESS_FIXTURES.cjk).toMatch(/表示/);
    expect(LOCALE_STRESS_FIXTURES.arabic).toMatch(/العرض/);
    expect(LOCALE_STRESS_FIXTURES.hebrew).toMatch(/תצוגה/);
    expect(LOCALE_STRESS_FIXTURES.mixedBidi).toContain("اسم");
  });
});
