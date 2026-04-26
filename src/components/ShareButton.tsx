import { useState, useCallback, useEffect, useRef } from "react";

interface ShareButtonProps {
  text: string;
  onCopied?: () => void;
}

/**
 * Copies `text` to clipboard and shows a checkmark for 1s on success.
 * Falls back to a hidden textarea + execCommand when clipboard API is unavailable.
 */
export function ShareButton({ text, onCopied }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    // Primary on mobile: Web Share API
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        onCopied?.();
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    let success = false;

    // Primary: Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        // Fall through to execCommand fallback
      }
    }

    // Fallback: hidden textarea + execCommand
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        success = true;
      } catch {
        // Both methods failed — nothing more we can do
      }
    }

    if (success) {
      setCopied(true);
      onCopied?.();
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 1000);
    }
  }, [text, onCopied]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Share result"}
      className={[
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "font-semibold text-sm uppercase tracking-wide",
        "transition-colors duration-150",
        copied
          ? "bg-tile-correct text-white"
          : "bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600",
      ].join(" ")}
    >
      <span aria-live="polite">
        {copied ? "✓ Copied!" : "Share"}
      </span>
    </button>
  );
}
