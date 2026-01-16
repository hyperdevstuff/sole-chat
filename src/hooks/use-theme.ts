import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    applyTheme(theme);

    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", handleSystemChange);
    return () => mq.removeEventListener("change", handleSystemChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setStoredTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  const resolvedTheme: ResolvedTheme = mounted
    ? theme === "system"
      ? getSystemTheme()
      : theme
    : "dark";

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted,
  };
}
