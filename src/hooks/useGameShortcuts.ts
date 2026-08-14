import { useEffect } from "react";
import type { ModalView } from "./useGameView";

interface GameShortcutsOptions {
  view: ModalView;
  closeView: () => void;
  submitInput: () => void;
  backspace: () => void;
  addChar: (character: string) => void;
  resetTodayIfStale: () => void;
}

export function useGameShortcuts({
  view,
  closeView,
  submitInput,
  backspace,
  addChar,
  resetTodayIfStale,
}: GameShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!document.hasFocus() || document.visibilityState !== "visible")
        return;
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Escape") {
        if (view !== null) closeView();
        return;
      }
      if (view !== null) return;

      if (
        event.target instanceof Element &&
        event.target.closest(
          "button, a, input, textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }

      if (event.key === "Enter") submitInput();
      else if (event.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(event.key)) addChar(event.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addChar, backspace, closeView, submitInput, view]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetTodayIfStale();
    };
    const onFocus = () => resetTodayIfStale();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const intervalId = setInterval(resetTodayIfStale, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [resetTodayIfStale]);
}
