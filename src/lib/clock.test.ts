import { describe, it, expect } from "vitest";
import { detectClockSkew } from "./clock";

/** Builds a minimal mock fetch that returns the given Date header value. */
function makeFetch(dateHeader: string | null, shouldThrow = false): typeof fetch {
  return async (_input: RequestInfo | URL, _init?: RequestInit) => {
    if (shouldThrow) throw new Error("Network error");
    const headers = new Headers();
    if (dateHeader !== null) headers.set("date", dateHeader);
    return new Response(null, { status: 200, headers });
  };
}

describe("detectClockSkew", () => {
  it("ok=true when server clock matches client (skew = 0ms)", async () => {
    const now = new Date().toUTCString();
    const result = await detectClockSkew(makeFetch(now));
    expect(result.ok).toBe(true);
    // Skew should be very small (a few ms for test execution)
    expect(Math.abs(result.skewMs)).toBeLessThan(5000);
  });

  it("ok=true for skew within 5 minutes (positive)", async () => {
    const slightlyOld = new Date(Date.now() - 2 * 60 * 1000).toUTCString();
    const result = await detectClockSkew(makeFetch(slightlyOld));
    expect(result.ok).toBe(true);
    expect(result.skewMs).toBeGreaterThan(0);
  });

  it("ok=true for skew within 5 minutes (negative)", async () => {
    const slightlyFuture = new Date(Date.now() + 2 * 60 * 1000).toUTCString();
    const result = await detectClockSkew(makeFetch(slightlyFuture));
    expect(result.ok).toBe(true);
    expect(result.skewMs).toBeLessThan(0);
  });

  it("ok=false for skew > 5 minutes (client ahead of server)", async () => {
    // Server reports a time 6 minutes in the past → client is ahead by 6 min
    const oldServerTime = new Date(Date.now() - 6 * 60 * 1000).toUTCString();
    const result = await detectClockSkew(makeFetch(oldServerTime));
    expect(result.ok).toBe(false);
    expect(Math.abs(result.skewMs)).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });

  it("ok=false for skew > 5 minutes (server ahead of client)", async () => {
    // Server reports a time 6 minutes in the future → client is behind by 6 min
    const futureServerTime = new Date(Date.now() + 6 * 60 * 1000).toUTCString();
    const result = await detectClockSkew(makeFetch(futureServerTime));
    expect(result.ok).toBe(false);
    expect(Math.abs(result.skewMs)).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });

  it("ok=true and skewMs=0 when no Date header is present", async () => {
    const result = await detectClockSkew(makeFetch(null));
    expect(result).toEqual({ skewMs: 0, ok: true });
  });

  it("ok=true and skewMs=0 when fetch throws", async () => {
    const result = await detectClockSkew(makeFetch(null, true));
    expect(result).toEqual({ skewMs: 0, ok: true });
  });

  it("boundary: exactly 5 minutes skew is ok=false (strictly less than)", async () => {
    const exactlyFiveMin = new Date(Date.now() - 5 * 60 * 1000).toUTCString();
    const result = await detectClockSkew(makeFetch(exactlyFiveMin));
    // Math.abs(skewMs) < 300000 is false when skewMs === 300000
    expect(result.ok).toBe(false);
  });
});
