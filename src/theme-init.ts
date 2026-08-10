const STORAGE_KEY = "idoldle-color-mode";

type ColorMode = "system" | "dark" | "light";

function isColorMode(value: unknown): value is ColorMode {
  return value === "system" || value === "dark" || value === "light";
}

function readColorMode(): ColorMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "dark";

    const parsed = JSON.parse(raw) as { _v?: unknown; data?: unknown };
    return parsed._v === 1 && isColorMode(parsed.data) ? parsed.data : "dark";
  } catch {
    return "dark";
  }
}

const colorMode = readColorMode();
const resolvedColorMode =
  colorMode === "system"
    ? window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark"
    : colorMode;

document.documentElement.dataset.theme = resolvedColorMode;
document.documentElement.style.colorScheme = resolvedColorMode;

const themeColor = document.querySelector<HTMLMetaElement>(
  'meta[name="theme-color"]',
);
if (themeColor) {
  themeColor.content = resolvedColorMode === "light" ? "#d6d9e8" : "#050719";
}
