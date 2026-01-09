"use client";

import { RealtimeProvider as UpstashRealtimeProvider } from "@upstash/realtime/client";
import type { ReactNode } from "react";

export function RealtimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <UpstashRealtimeProvider api={{ url: "/api/realtime" }}>
      {children}
    </UpstashRealtimeProvider>
  );
}
