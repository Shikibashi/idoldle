interface ToastProps {
  message: string | null;
}

/**
 * Renders a transient toast message at the top of the game area.
 * Visual feedback is paired with the persistent polite game announcement;
 * ordinary input feedback must not interrupt the operator assertively.
 * Auto-fade is handled by the parent (which sets message to null after 1.5s).
 * The transition class handles the visual fade when message goes null.
 */
export function Toast({ message }: ToastProps) {
  return (
    <div
      className={[
        "fixed top-16 left-1/2 -translate-x-1/2 z-50",
        "retro-toast text-sm font-semibold",
        "px-4 py-2 shadow-lg",
        "pointer-events-none select-none",
        "transition-opacity duration-300",
        message ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {message ?? ""}
    </div>
  );
}
