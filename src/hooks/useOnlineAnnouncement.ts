import { useEffect, useRef } from "react";
import { ENGLISH_STRINGS as strings } from "../lib/strings";

export function useOnlineAnnouncement(
  online: boolean,
  announce: (message: string) => void,
) {
  const previousOnlineRef = useRef(online);

  useEffect(() => {
    if (!online) announce(strings.game.announcements.offline);
    else if (previousOnlineRef.current !== online)
      announce(strings.game.announcements.online);
    previousOnlineRef.current = online;
  }, [announce, online]);
}
