interface ClockSkewBannerProps {
  skewMinutes: number;
  onDismiss: () => void;
}

/**
 * Non-blocking banner shown when the client clock deviates from the
 * server clock by more than 5 minutes (AC-24).
 */
export function ClockSkewBanner({ skewMinutes, onDismiss }: ClockSkewBannerProps) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm"
    >
      <span>
        Your device clock appears to be off by{" "}
        <strong>{Math.abs(skewMinutes)}</strong> minute
        {Math.abs(skewMinutes) !== 1 ? "s" : ""}; today&apos;s puzzle may be
        wrong.
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss clock skew warning"
        className="shrink-0 text-yellow-700 hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
      >
        &times;
      </button>
    </div>
  );
}
