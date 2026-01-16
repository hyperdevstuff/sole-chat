import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  setStoredTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Subscribe to system color scheme changes
 * Returns current resolved theme and updates on media query changes
 */
function subscribeToSystemTheme(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getServerSnapshot(): ResolvedTheme {
  return "dark"; // SSR default
}

function getClientSnapshot(): ResolvedTheme {
  return getSystemTheme();
}

/**
 * Theme hook for reading/writing theme preference
 *
 * @returns theme - Current theme setting ('light' | 'dark' | 'system')
 * @returns resolvedTheme - Actual applied theme ('light' | 'dark')
 * @returns setTheme - Function to update theme
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage on client, default to 'system' on server
    if (typeof window === "undefined") return "system";
    return getStoredTheme() ?? "system";
  });

  // Track system preference changes for 'system' theme
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getClientSnapshot,
    getServerSnapshot
  );

  // Resolved theme = actual applied theme (no 'system')
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : theme;

  // Apply theme to DOM when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, systemTheme]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored && stored !== theme) {
      setThemeState(stored);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setStoredTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}
