import type { Snapshot } from "../types";

interface AttributionFooterProps {
  snapshot: Snapshot;
}

export function AttributionFooter({ snapshot }: AttributionFooterProps) {
  const attr = snapshot.attribution;

  return (
    <footer className="retro-footer py-2 text-center text-xs select-none">
      {attr ? (
        <>
          <span className="retro-footer__label">DATA //</span>{" "}
          <a
            href={attr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="retro-link underline"
          >
            <bdi dir="auto">{attr.source}</bdi>
          </a>{" "}
          // {attr.license}
        </>
      ) : (
        "v1 hand-curated snapshot."
      )}
      <span className="retro-footer__rule" aria-hidden="true"> · </span>
      <span>best viewed with curiosity // no plugins required</span>
    </footer>
  );
}
