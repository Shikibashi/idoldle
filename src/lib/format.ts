/**
 * Format stable UTC date keys for people while retaining the raw key in the
 * time element for machine-readable state and sharing logic.
 */
export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}
