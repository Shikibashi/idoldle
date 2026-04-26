import type { Snapshot } from "../types";

interface AttributionFooterProps {
  snapshot: Snapshot;
}

export function AttributionFooter({ snapshot }: AttributionFooterProps) {
  const attr = snapshot.attribution;

  return (
    <footer className="py-2 text-center text-xs text-gray-600 dark:text-gray-400 select-none">
      {attr ? (
        <>
          Data:{" "}
          <a
            href={attr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-800 dark:hover:text-gray-300"
          >
            {attr.source}
          </a>{" "}
          &middot; {attr.license}
        </>
      ) : (
        "v1 hand-curated snapshot."
      )}
    </footer>
  );
}
