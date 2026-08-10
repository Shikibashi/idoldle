import { describe, expect, it } from "vitest";
import { contrastRatio, computedRemPixels, meetsContrast } from "./contrast";
import { ECW_TARGET_FLOOR_PX, ECW_THEME_TOKENS } from "./ecwTokens";
import manifest from "./ecwTokens.manifest.json";

describe("ECW theme token contracts", () => {
  it("keeps ordinary semantic text readable on the canvas", () => {
    for (const tokens of Object.values(ECW_THEME_TOKENS)) {
      expect(meetsContrast(tokens.text, tokens.canvas, 4.5)).toBe(true);
      expect(meetsContrast(tokens.muted, tokens.canvas, 4.5)).toBe(true);
      expect(meetsContrast(tokens.link, tokens.canvas, 4.5)).toBe(true);
    }
  });

  it("uses explicit on-accent text tokens for status fills", () => {
    for (const tokens of Object.values(ECW_THEME_TOKENS)) {
      expect(meetsContrast(tokens.warningOnAccent, tokens.warningAccent, 4.5)).toBe(true);
      expect(meetsContrast(tokens.successOnAccent, tokens.successAccent, 4.5)).toBe(true);
      expect(meetsContrast(tokens.infoOnAccent, tokens.infoAccent, 4.5)).toBe(true);
      expect(meetsContrast(tokens.errorOnAccent, tokens.errorAccent, 4.5)).toBe(true);
    }
  });

  it("keeps the ECW focus bands at the stronger internal contrast floor", () => {
    for (const tokens of Object.values(ECW_THEME_TOKENS)) {
      expect(contrastRatio(tokens.focusInner, tokens.focusOuter)).toBeGreaterThanOrEqual(9);
    }
  });

  it("evaluates the target floor in CSS pixels rather than only in rem", () => {
    expect(computedRemPixels(1.5, 16)).toBeGreaterThanOrEqual(ECW_TARGET_FLOOR_PX);
    expect(computedRemPixels(1.5, 14)).toBeLessThan(ECW_TARGET_FLOOR_PX);
  });

  it("publishes a machine-readable ECW manifest", () => {
    expect(manifest.version).toBe("3.2");
    expect(manifest.tokens.density.hitMinCssPx).toBeGreaterThanOrEqual(24);
    expect(manifest.tokens.focus.bandThicknessCssPx).toBeGreaterThanOrEqual(2);
    expect(manifest.tokens.status.requiredChannels).toEqual([
      "text",
      "accent",
      "border",
      "onAccent",
    ]);
  });
});
