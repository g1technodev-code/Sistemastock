/**
 * Validated palette (see dataviz skill: references/palette.md), re-checked against
 * this app's actual light (#ffffff) and dark (#171717 / Tailwind neutral-900) chart
 * surfaces with scripts/validate_palette.js — both pass all CVD/contrast gates.
 */
export const categorical = {
  light: ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"],
  dark: ["#3987e5", "#008300", "#d55181", "#c98500", "#199e70", "#d95926", "#9085e9", "#e66767"],
};

export const sequentialBlue = {
  light: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#2a78d6", "#1c5cab", "#104281"],
  dark: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#2a78d6", "#1c5cab", "#104281"],
};

export const status = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export const chrome = {
  light: {
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    muted: "#898781",
    secondaryInk: "#52514e",
    primaryInk: "#0b0b0b",
  },
  dark: {
    grid: "#2c2c2a",
    axis: "#383835",
    muted: "#898781",
    secondaryInk: "#c3c2b7",
    primaryInk: "#ffffff",
  },
};

export function useIsDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getCategoricalPalette(isDark: boolean): string[] {
  return isDark ? categorical.dark : categorical.light;
}

export function getChrome(isDark: boolean) {
  return isDark ? chrome.dark : chrome.light;
}
