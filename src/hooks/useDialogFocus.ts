import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogFocus(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getClientRects().length > 0,
      );

    const shell = dialog.closest<HTMLElement>(".site-shell");
    const inertSiblings = shell
      ? Array.from(shell.children)
          .filter((element) => !element.contains(dialog))
          .map((element) => ({
            element: element as HTMLElement,
            inert: (element as HTMLElement).inert,
          }))
      : [];

    for (const { element } of inertSiblings) element.inert = true;

    const firstFocusable = focusable()[0];
    (firstFocusable ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (firstFocusable ?? dialog).focus();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      for (const { element, inert } of inertSiblings) element.inert = inert;
    };
  }, [dialogRef, open]);
}
