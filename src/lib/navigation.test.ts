import { describe, expect, it } from "vitest";
import { hashForView, viewFromHash } from "./navigation";

describe("addressable page views", () => {
  it("maps supported fragments to views", () => {
    expect(viewFromHash("#about")).toBe("about");
    expect(viewFromHash("#HOW-TO-PLAY")).toBe("how-to-play");
    expect(viewFromHash("#statistics")).toBe("statistics");
    expect(viewFromHash("#unknown")).toBeNull();
  });

  it("creates stable fragments for links and browser history", () => {
    expect(hashForView("about")).toBe("#about");
    expect(hashForView("how-to-play")).toBe("#how-to-play");
    expect(hashForView("statistics")).toBe("#statistics");
  });
});
