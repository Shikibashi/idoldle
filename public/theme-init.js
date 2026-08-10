(() => {
  const read = (key, valid, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && parsed._v === 1 && valid(parsed.data) ? parsed.data : fallback;
    } catch {
      return fallback;
    }
  };

  const colorMode = read(
    "idoldle-color-mode",
    (value) => value === "system" || value === "dark" || value === "light",
    "system",
  );
  const resolvedColorMode =
    colorMode === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
      : colorMode;
  const density = read(
    "idoldle-density",
    (value) => value === "automatic" || value === "compact" || value === "comfortable",
    "automatic",
  );
  const resolvedDensity =
    density === "automatic"
      ? window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches
        ? "comfortable"
        : "compact"
      : density;
  const contrast = read(
    "idoldle-contrast",
    (value) => value === "normal" || value === "increased",
    "normal",
  );

  document.documentElement.dataset.theme = resolvedColorMode;
  document.documentElement.dataset.density = resolvedDensity;
  document.documentElement.dataset.contrast = contrast;
  document.documentElement.style.colorScheme = resolvedColorMode;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = resolvedColorMode === "light" ? "#d6d9e8" : "#050719";
})();
