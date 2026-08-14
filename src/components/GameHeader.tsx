import type { GameState, Stats } from "../types";
import type { AppView } from "../lib/navigation";
import { HUD, type HUDProps } from "./HUD";

type GameHeaderProps = Pick<
  HUDProps,
  | "colorMode"
  | "resolvedColorMode"
  | "density"
  | "resolvedDensity"
  | "contrast"
  | "onColorModeChange"
  | "onDensityChange"
  | "onContrastChange"
  | "onResetDisplayPreferences"
> & {
  state: GameState;
  stats: Stats;
  dateKey: string;
  themeLabel: string;
  view: AppView | null;
  openView: (view: AppView, origin?: HTMLElement) => void;
};

export function GameHeader({
  state,
  stats,
  dateKey,
  themeLabel,
  view,
  openView,
  ...displayProps
}: GameHeaderProps) {
  return (
    <HUD
      {...displayProps}
      dateKey={dateKey}
      themeLabel={themeLabel}
      currentStreak={stats.currentStreak}
      longestStreak={stats.longestStreak}
      currentAttempt={
        state.status === "playing"
          ? state.guesses.length + 1
          : state.guesses.length
      }
      maxGuesses={state.maxGuesses}
      onOpenStats={(origin) => openView("statistics", origin)}
      onOpenAbout={(origin) => openView("about", origin)}
      onOpenHow={(origin) => openView("how-to-play", origin)}
      activeView={view}
    />
  );
}
