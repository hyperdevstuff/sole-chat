"use client";

import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { ToastProvider } from "@/hooks/use-toast";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <RealtimeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </RealtimeProvider>
  );
};
