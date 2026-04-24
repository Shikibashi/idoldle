export interface ClockSkew {
  skewMs: number;
  ok: boolean;
}

/**
 * Detects whether the client clock is significantly skewed relative to
 * the server clock by issuing a HEAD request and reading the `Date`
 * response header.
 *
 * - If the skew is less than 5 minutes in either direction, `ok` is true.
 * - If the fetch fails or the server returns no `Date` header, we treat
 *   the clock as acceptable (`ok: true, skewMs: 0`) to avoid false alarms.
 *
 * @param fetchImpl - Injectable fetch implementation (defaults to global fetch).
 *                   Pass a mock in tests.
 */
export async function detectClockSkew(
  fetchImpl: typeof fetch = fetch,
): Promise<ClockSkew> {
  try {
    const res = await fetchImpl("/", { method: "HEAD", cache: "no-store" });
    const serverDate = res.headers.get("date");
    if (!serverDate) return { skewMs: 0, ok: true };
    const skewMs = Date.now() - new Date(serverDate).getTime();
    return { skewMs, ok: Math.abs(skewMs) < 5 * 60 * 1000 };
  } catch {
    return { skewMs: 0, ok: true };
  }
}
