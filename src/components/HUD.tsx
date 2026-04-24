interface HUDProps {
  dateKey: string;
  themeLabel: string;
  onOpenStats: () => void;
}

export function HUD({ dateKey, themeLabel, onOpenStats }: HUDProps) {
  return (
    <header className="flex items-center justify-between w-full px-3 py-2 border-b border-gray-200">
      <div className="w-8" /> {/* spacer to center title */}
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-bold tracking-wide">Idoldle</h1>
        <p className="text-xs text-gray-500">
          {themeLabel} &middot; {dateKey}
        </p>
      </div>
      <button
        onClick={onOpenStats}
        aria-label="Open statistics"
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        {/* Simple bar-chart icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-gray-700"
          aria-hidden="true"
        >
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
        </svg>
      </button>
    </header>
  );
}
