const STORAGE_KEY = "idoldle-color-mode";
const DENSITY_STORAGE_KEY = "idoldle-density";
const CONTRAST_STORAGE_KEY = "idoldle-contrast";

type ColorMode = "system" | "dark" | "light";
type Density = "automatic" | "compact" | "comfortable";
type Contrast = "normal" | "increased";

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

function isDensity(value: unknown): value is Density {
  return value === "automatic" || value === "compact" || value === "comfortable";
}

function readDensity(): Density {
  try {
    const raw = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    if (!raw) return "automatic";

    const parsed = JSON.parse(raw) as { _v?: unknown; data?: unknown };
    return parsed._v === 1 && isDensity(parsed.data) ? parsed.data : "automatic";
  } catch {
    return "automatic";
  }
}

function resolveDensity(density: Density): Exclude<Density, "automatic"> {
  if (density !== "automatic") return density;

  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasNoHover = window.matchMedia("(hover: none)").matches;
  return hasCoarsePointer || hasNoHover ? "comfortable" : "compact";
}

function isContrast(value: unknown): value is Contrast {
  return value === "normal" || value === "increased";
}

function readContrast(): Contrast {
  try {
    const raw = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
    if (!raw) return "normal";

    const parsed = JSON.parse(raw) as { _v?: unknown; data?: unknown };
    return parsed._v === 1 && isContrast(parsed.data) ? parsed.data : "normal";
  } catch {
    return "normal";
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
document.documentElement.dataset.density = resolveDensity(readDensity());
document.documentElement.dataset.contrast = readContrast();

const themeColor = document.querySelector<HTMLMetaElement>(
  'meta[name="theme-color"]',
);
if (themeColor) {
  themeColor.content = resolvedColorMode === "light" ? "#d6d9e8" : "#050719";
}
