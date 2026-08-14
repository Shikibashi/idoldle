import { useCallback } from "react";
import type { ReactNode, RefObject } from "react";
import type { GameState, LetterState } from "../types";
import { ENGLISH_STRINGS as strings } from "../lib/strings";
import { Board } from "./Board";
import { Keyboard } from "./Keyboard";

interface GamePlayAreaProps {
  state: GameState;
  shaking: boolean;
  letterStates: Record<string, LetterState>;
  mainRef: RefObject<HTMLElement>;
  onSubmitInput: () => void;
  onBackspace: () => void;
  onAddChar: (character: string) => void;
  onOpenStats: (origin: HTMLElement) => void;
  children: ReactNode;
}

export function GamePlayArea({
  state,
  shaking,
  letterStates,
  mainRef,
  onSubmitInput,
  onBackspace,
  onAddChar,
  onOpenStats,
  children,
}: GamePlayAreaProps) {
  const handleKey = useCallback(
    (key: string) => {
      if (key === "Enter") onSubmitInput();
      else if (key === "Backspace") onBackspace();
      else onAddChar(key);
    },
    [onAddChar, onBackspace, onSubmitInput],
  );

  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      className="retro-main site-game-main flex flex-col items-center flex-1 gap-4"
    >
      <div className="site-game-column flex flex-col max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto gap-4">
        <Board
          guesses={state.guesses}
          currentInput={state.currentInput}
          shaking={shaking}
          maxGuesses={state.maxGuesses}
          length={state.length}
        />

        <Keyboard letterStates={letterStates} onKey={handleKey} />

        <div className="site-legend" aria-label={strings.game.legend}>
          <span>
            <i
              className="site-swatch site-swatch--correct"
              aria-hidden="true"
            />{" "}
            <b aria-hidden="true">✓</b> {strings.game.correct}
          </span>
          <span>
            <i
              className="site-swatch site-swatch--present"
              aria-hidden="true"
            />{" "}
            <b aria-hidden="true">≈</b> {strings.game.present}
          </span>
          <span>
            <i className="site-swatch site-swatch--absent" aria-hidden="true" />{" "}
            <b aria-hidden="true">×</b> {strings.game.absent}
          </span>
        </div>

        {(state.status === "won" || state.status === "lost") && (
          <section
            className="site-completion-status"
            aria-labelledby="completion-status-title"
          >
            <h2 id="completion-status-title">
              {state.status === "won" ? "Puzzle solved" : "Puzzle complete"}
            </h2>
            <p>
              {state.status === "won"
                ? `Solved in ${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}.`
                : `The answer was ${state.answer.stageName}.`}
            </p>
            <button
              type="button"
              className="site-text-button"
              onClick={(event) => onOpenStats(event.currentTarget)}
            >
              <span aria-hidden="true">[ </span>
              {strings.navigation.statistics}
              <span aria-hidden="true"> ]</span>
            </button>
          </section>
        )}
      </div>

      {children}
    </main>
  );
}
