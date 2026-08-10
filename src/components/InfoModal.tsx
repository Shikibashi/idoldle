import { useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";

type InfoMode = "about" | "how";

interface InfoModalProps {
  mode: InfoMode | null;
  onClose: () => void;
}

export function InfoModal({ mode, onClose }: InfoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogFocus(mode !== null, dialogRef);

  if (!mode) return null;

  const isAbout = mode === "about";

  return (
    <div
      className="retro-modal-backdrop fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="retro-modal site-info-modal relative max-h-[calc(100dvh-2rem)] min-w-0 w-[min(92vw,520px)] overflow-y-auto p-5 focus:outline-none"
      >
        <button
          onClick={onClose}
          aria-label="Close information"
          className="retro-modal__close absolute right-2 top-2 flex h-12 w-12 items-center justify-center"
        >
          ×
        </button>

        <h2 id="info-modal-title" className="retro-modal__title pr-12 text-lg font-bold uppercase tracking-widest">
          {isAbout ? "About Idoldle" : "How to Play"}
        </h2>

        {isAbout ? (
          <div className="site-info-copy mt-4 space-y-3 text-sm leading-relaxed">
            <p>
              Idoldle is a daily Wordle-style game about K-pop girl-group idol stage names.
              Every puzzle is drawn from a frozen local dataset, so the daily answer remains
              deterministic even when the site is updated.
            </p>
            <p>
              There are no accounts or server-side profiles. Your streak, history, badges,
              and fastest solve live in this browser.
            </p>
            <p className="retro-modal__muted">
              Built as a small, explicit web game: keyboard-friendly, touch-friendly, and
              intentionally free of feeds, logins, and hidden navigation.
            </p>
          </div>
        ) : (
          <div className="site-info-copy mt-4 space-y-3 text-sm leading-relaxed">
            <p>Guess today&apos;s idol stage name in six tries.</p>
            <ul className="site-rule-list space-y-2">
              <li><span className="site-swatch site-swatch--correct" /> Green: right letter, right place.</li>
              <li><span className="site-swatch site-swatch--present" /> Yellow: right letter, wrong place.</li>
              <li><span className="site-swatch site-swatch--absent" /> Gray: letter is not in the answer.</li>
            </ul>
            <p>
              The required stage-name length changes with the day. You can click the on-screen
              keyboard or type on a physical keyboard. Enter submits; Backspace deletes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
