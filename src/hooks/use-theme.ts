"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// Using useSyncExternalStore to avoid React Compiler lint error with setState in useEffect
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    theme: (theme as Theme) ?? "system",
    setTheme: setTheme as (theme: Theme) => void,
    resolvedTheme: (resolvedTheme as ResolvedTheme) ?? "dark",
    mounted,
  };
}
