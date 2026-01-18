"use client";

import { useTheme as useNextTheme } from "next-themes";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const mounted = typeof window !== "undefined" && resolvedTheme !== undefined;

  return {
    theme: (theme as Theme) ?? "system",
    setTheme: setTheme as (theme: Theme) => void,
    resolvedTheme: (resolvedTheme as ResolvedTheme) ?? "dark",
    mounted,
  };
}
