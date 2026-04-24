interface ToastProps {
  message: string | null;
}

/**
 * Renders a transient toast message at the top of the game area.
 * Uses role="alert" + aria-live="assertive" per AC-23.
 * Auto-fade is handled by the parent (which sets message to null after 1.5s).
 * The transition class handles the visual fade when message goes null.
 */
export function Toast({ message }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        "fixed top-16 left-1/2 -translate-x-1/2 z-50",
        "bg-gray-900 text-white text-sm font-semibold",
        "px-4 py-2 rounded-full shadow-lg",
        "pointer-events-none select-none",
        "transition-opacity duration-300",
        message ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {message ?? ""}
    </div>
  );
}
