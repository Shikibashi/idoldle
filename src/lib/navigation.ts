export type AppView = "about" | "how-to-play" | "statistics";

const HASH_TO_VIEW: Record<string, AppView> = {
  "#about": "about",
  "#how-to-play": "how-to-play",
  "#statistics": "statistics",
};

export function viewFromHash(hash: string): AppView | null {
  return HASH_TO_VIEW[hash.toLowerCase()] ?? null;
}

export function hashForView(view: AppView): string {
  return `#${view}`;
}
