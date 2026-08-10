export type EcwTheme = "dark" | "light";

export interface EcwThemeTokens {
  canvas: string;
  canvasAlt: string;
  panel: string;
  panelDeep: string;
  panelRaised: string;
  panelRecessed: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  borderStrong: string;
  rule: string;
  link: string;
  linkVisited: string;
  purple: string;
  pink: string;
  warningText: string;
  warningAccent: string;
  warningBorder: string;
  warningOnAccent: string;
  successText: string;
  successAccent: string;
  successBorder: string;
  successOnAccent: string;
  infoText: string;
  infoAccent: string;
  infoBorder: string;
  infoOnAccent: string;
  errorText: string;
  errorAccent: string;
  errorBorder: string;
  errorOnAccent: string;
  focusOuter: string;
  focusInner: string;
}

export const ECW_THEME_TOKENS: Record<EcwTheme, EcwThemeTokens> = {
  dark: {
    canvas: "#070a2e",
    canvasAlt: "#050719",
    panel: "#12144b",
    panelDeep: "#0b0d38",
    panelRaised: "#1c1e67",
    panelRecessed: "#02030d",
    text: "#f9f3ff",
    textSecondary: "#dfe6ff",
    muted: "#aeb6e9",
    border: "#6675c8",
    borderStrong: "#7787e8",
    rule: "#343960",
    link: "#6ff4ff",
    linkVisited: "#c594ff",
    purple: "#b189ff",
    pink: "#ff76d7",
    warningText: "#ffd45c",
    warningAccent: "#ffd45c",
    warningBorder: "#ffd45c",
    warningOnAccent: "#050719",
    successText: "#23d5a6",
    successAccent: "#23d5a6",
    successBorder: "#23d5a6",
    successOnAccent: "#050719",
    infoText: "#6ff4ff",
    infoAccent: "#6ff4ff",
    infoBorder: "#6ff4ff",
    infoOnAccent: "#050719",
    errorText: "#ff76a8",
    errorAccent: "#ff76a8",
    errorBorder: "#ff76a8",
    errorOnAccent: "#050719",
    focusOuter: "#ffd45c",
    focusInner: "#050719",
  },
  light: {
    canvas: "#c7ccdf",
    canvasAlt: "#d6d9e8",
    panel: "#f4f3eb",
    panelDeep: "#e1e3ee",
    panelRaised: "#ffffff",
    panelRecessed: "#d4d6df",
    text: "#11132d",
    textSecondary: "#24274a",
    muted: "#4d5372",
    border: "#626a9c",
    borderStrong: "#383f78",
    rule: "#9da2bd",
    link: "#004fa3",
    linkVisited: "#65349a",
    purple: "#5530a3",
    pink: "#a82378",
    warningText: "#6b4600",
    warningAccent: "#ffd45c",
    warningBorder: "#6b4600",
    warningOnAccent: "#11132d",
    successText: "#055c49",
    successAccent: "#23d5a6",
    successBorder: "#055c49",
    successOnAccent: "#11132d",
    infoText: "#005a6e",
    infoAccent: "#6ff4ff",
    infoBorder: "#005a6e",
    infoOnAccent: "#11132d",
    errorText: "#9b245f",
    errorAccent: "#ff76a8",
    errorBorder: "#9b245f",
    errorOnAccent: "#11132d",
    focusOuter: "#522598",
    focusInner: "#ffffff",
  },
};

export const ECW_TARGET_FLOOR_PX = 24;
