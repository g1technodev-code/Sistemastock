import { useEffect } from "react";

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}

/**
 * Registers global keyboard shortcuts. Keys of `map` are combos like "ctrl+k", "f2", "escape".
 * Shortcuts that don't include a modifier are ignored while the user is typing in a field,
 * except "escape" which always fires.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      const combo = comboFromEvent(e);
      const callback = map[combo];
      if (!callback) return;

      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (TYPING_TAGS.has(target.tagName) || target.isContentEditable);
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
      if (isTyping && !hasModifier && combo !== "escape") return;

      e.preventDefault();
      callback(e);
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [map, enabled]);
}
