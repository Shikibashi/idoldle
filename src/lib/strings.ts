/**
 * The English UI catalog is intentionally small and plain.  Product copy is
 * kept out of component geometry so translated strings can expand, wrap, or
 * be replaced by a future locale without rewriting the ECW layout.
 */
export const ENGLISH_STRINGS = {
  navigation: {
    home: "Idoldle home",
    about: "About",
    howToPlay: "How to play",
    statistics: "Statistics",
    github: "GitHub",
    display: "Display",
    displayOptions: "Display options",
    resetDisplay: "Reset display",
  },
  display: {
    title: "Display",
    appearance: "Appearance",
    system: "System",
    light: "Light",
    dark: "Dark",
    density: "Density",
    automatic: "Automatic",
    compact: "Compact",
    comfortable: "Comfortable",
    contrast: "Contrast",
    normal: "Normal",
    increased: "Increased",
    using: (value: string) => `Using ${value}`,
  },
  status: {
    today: "Today",
    theme: "Theme",
    attempt: "Attempt",
    streak: "Streak",
    best: "Best",
  },
  game: {
    challenge: "Today's challenge",
    inputDeck: "Input deck",
    clickOrType: "click or type",
    legend: "Tile color legend",
    correct: "Correct place",
    present: "Present elsewhere",
    absent: "Not in answer",
    hint: "Enter a stage name to decode the idol",
    shortViewport:
      "Short viewport: the page remains usable with ordinary browser scrolling.",
    announcements: {
      guessSubmitted: (correct: string, present: string, absent: string, attempt: number) =>
        `Guess submitted. ${correct} correct, ${present} present, ${absent} absent. Attempt ${attempt} of 6.`,
      solved: (guessCount: number, answer: string) =>
        `Puzzle solved in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}. Answer: ${answer}.`,
      lost: (answer: string) => `Puzzle lost. Answer: ${answer}.`,
      invalidLength: (length: number) => `Need ${length} letters.`,
      invalidIdol: "Not a valid idol name.",
      newPuzzle: "A new daily puzzle is ready.",
      offline: "Offline — showing the cached puzzle state.",
      online: "Connection restored.",
      shareCopied: "Share text copied to the clipboard.",
    },
  },
  page: {
    aboutTitle: "What is Idoldle?",
    aboutSummary:
      "A daily word game about idol stage names. One puzzle per day, six attempts.",
    moreAbout: "More about the game",
    dataInfo: "Data info",
    snapshot: "Idol database snapshot:",
    idolsInSnapshot: (count: string) => `${count} idols in the local snapshot.`,
    recentResults: "Recent results",
    noCompletedGames: "No completed games yet. Today can be the first.",
    date: "Date",
    score: "Score",
    status: "Status",
    solved: "Solved",
    missed: "Missed",
  },
  state: {
    loading: "Loading today's puzzle…",
    offline:
      "Offline — showing the local puzzle state. Reconnect before loading a new snapshot.",
    loadFailure: "Could not load local puzzle data.",
    offlineRetry: "The browser is offline. Reconnect, then retry the local snapshot.",
    retrySnapshot: "Retry snapshot",
    shortFailure: (message: string) => `The snapshot request failed (${message}).`,
  },
  modal: {
    closeInformation: "Close information",
    closeStatistics: "Close statistics",
    aboutTitle: "About Idoldle",
    howToPlay: "How to Play",
    statistics: "Statistics",
  },
} as const;

const NUMBER_WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
] as const;

export function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value);
}

export type UiStrings = typeof ENGLISH_STRINGS;

export function getUiStrings(_locale = "en"): UiStrings {
  // English is the product default.  Locale plumbing is intentionally kept
  // stable so a translated catalog can be added without changing call sites.
  return ENGLISH_STRINGS;
}

/** Expand short strings for deterministic pseudolocalization layout tests. */
export function pseudoLocalize(value: string, multiplier = 2): string {
  const marked = value.replace(/[A-Za-z]/g, (character) =>
    "ÁÉÍÓÚáéíóúÇçÑñ"[character.charCodeAt(0) % 12] ?? character,
  );
  const extra = Math.max(0, Math.ceil(value.length * (multiplier - 1)));
  return `⟦${marked}${"·".repeat(extra)}⟧`;
}

export const LOCALE_STRESS_FIXTURES = {
  pseudoShort: pseudoLocalize("Display", 3),
  germanCompound: "Donaudampfschifffahrtsgesellschaftsverwaltung",
  finnishCompound: "epäjärjestelmällistyttämättömyydellänsäkään",
  dutchCompound: "kindercarnavalsoptochtvoorbereidingswerkzaamheden",
  cjk: "表示設定をリセット",
  arabic: "إعدادات العرض",
  hebrew: "הגדרות תצוגה",
  mixedBidi: "stage-اسم-42 / \u2067D-17\u2069",
} as const;
