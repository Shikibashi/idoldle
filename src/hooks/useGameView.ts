import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { hashForView, viewFromHash, type AppView } from "../lib/navigation";

export type ModalView = AppView | null;
type InfoMode = "about" | "how" | null;

interface GameViewState {
  mainRef: RefObject<HTMLElement>;
  view: ModalView;
  statsOpen: boolean;
  infoMode: InfoMode;
  openView: (nextView: AppView, origin?: HTMLElement) => void;
  closeView: () => void;
}

export function useGameView(): GameViewState {
  const [view, setView] = useState<ModalView>(() =>
    viewFromHash(window.location.hash),
  );
  const mainRef = useRef<HTMLElement>(null);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);
  const previousViewRef = useRef<ModalView>(view);

  const rememberModalOrigin = useCallback(() => {
    const active = document.activeElement;
    modalReturnFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);

  const restoreModalFocus = useCallback(() => {
    const origin = modalReturnFocusRef.current;
    modalReturnFocusRef.current = null;
    if (origin?.isConnected) origin.focus();
    else mainRef.current?.focus();
  }, []);

  const rememberViewOrigin = useCallback(
    (origin?: HTMLElement) => {
      if (origin) modalReturnFocusRef.current = origin;
      else rememberModalOrigin();
    },
    [rememberModalOrigin],
  );

  const closeView = useCallback(() => {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    setView(null);
  }, []);

  const openView = useCallback(
    (nextView: AppView, origin?: HTMLElement) => {
      rememberViewOrigin(origin);
      if (viewFromHash(window.location.hash) !== nextView) {
        window.history.pushState(null, "", hashForView(nextView));
      }
      setView(nextView);
    },
    [rememberViewOrigin],
  );

  useEffect(() => {
    const syncHashView = () => setView(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", syncHashView);
    syncHashView();
    return () => window.removeEventListener("hashchange", syncHashView);
  }, []);

  useEffect(() => {
    if (previousViewRef.current !== null && view === null) restoreModalFocus();
    previousViewRef.current = view;
  }, [restoreModalFocus, view]);

  return {
    mainRef,
    view,
    statsOpen: view === "statistics",
    infoMode:
      view === "about" || view === "how-to-play"
        ? view === "about"
          ? "about"
          : "how"
        : null,
    openView,
    closeView,
  };
}
