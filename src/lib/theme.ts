// Theme Configuration

/** localStorage key for theme preference */
export const THEME_KEY = "sole-chat-theme";

/** Available theme options */
export type Theme = "light" | "dark" | "system";

/** Resolved theme (no 'system' - actual value) */
export type ResolvedTheme = "light" | "dark";

/**
 * Get the system's preferred color scheme
 * Defaults to 'dark' if prefers-color-scheme is not supported
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Get the stored theme preference from localStorage
 * Returns null if no preference is stored or on server
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return null;
}

/**
 * Save theme preference to localStorage
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Resolve 'system' theme to actual light/dark value
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to the document by adding/removing 'dark' class on <html>
 * This is the source of truth for CSS dark mode styling
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }

  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Inline script to prevent flash of wrong theme
 * This should be inserted in the <head> before any content renders
 * It reads localStorage and applies the dark class immediately
 */
export const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_KEY}');
    var isDark = theme === 'dark' || 
      (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;
