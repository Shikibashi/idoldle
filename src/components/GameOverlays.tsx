import type { Snapshot, Stats, Idol } from "../types";
import { ENGLISH_STRINGS as strings } from "../lib/strings";
import { AttributionFooter } from "./AttributionFooter";
import { InfoModal } from "./InfoModal";
import { StatsModal } from "./StatsModal";
import { Toast } from "./Toast";

interface GameOverlaysProps {
  snapshot: Snapshot;
  toast: string | null;
  announcement: string | null;
  assertiveAnnouncement: string | null;
  infoMode: "about" | "how" | null;
  statsOpen: boolean;
  stats: Stats;
  lastGame: { won: boolean; guessCount: number; answer: Idol } | null;
  shareCard: string;
  closeView: () => void;
  announce: (message: string, assertive?: boolean) => void;
}

export function GameOverlays({
  snapshot,
  toast,
  announcement,
  assertiveAnnouncement,
  infoMode,
  statsOpen,
  stats,
  lastGame,
  shareCard,
  closeView,
  announce,
}: GameOverlaysProps) {
  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement ?? ""}
      </p>
      <p className="sr-only" role="alert" aria-atomic="true">
        {assertiveAnnouncement ?? ""}
      </p>

      <AttributionFooter snapshot={snapshot} />
      <Toast message={toast} />
      <InfoModal mode={infoMode} onClose={closeView} />
      <StatsModal
        open={statsOpen}
        onClose={closeView}
        stats={stats}
        lastGame={lastGame}
        shareText={shareCard}
        onShare={() => announce(strings.game.announcements.shareCopied)}
      />
    </>
  );
}
