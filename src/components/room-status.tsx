"use client";

import { Lock, Unlock, Users, Wifi, WifiOff } from "lucide-react";

interface RoomStatusProps {
  connectionStatus: "connected" | "connecting" | "error";
  isE2EE: boolean;
  participantCount: number;
  maxParticipants: number;
}

export function RoomStatus({
  connectionStatus,
  isE2EE,
  participantCount,
  maxParticipants,
}: RoomStatusProps) {
  const getConnectionState = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          color: "bg-accent",
          icon: Wifi,
          label: "Connected",
          animate: "",
          textColor: "text-accent",
        };
      case "connecting":
        return {
          color: "bg-amber-400",
          icon: Wifi,
          label: "Connecting",
          animate: "animate-pulse-subtle",
          textColor: "text-amber-400",
        };
      case "error":
        return {
          color: "bg-destructive",
          icon: WifiOff,
          label: "Disconnected",
          animate: "",
          textColor: "text-destructive",
        };
    }
  };

  const status = getConnectionState();

  return (
    <div
      className="group flex h-10 items-center gap-3 rounded-full bg-surface-elevated px-5 py-2 font-medium text-sm text-foreground shadow-sm transition-all select-none border border-border/50 backdrop-blur-sm"
      role="status"
      aria-label={`Status: ${status.label}, ${isE2EE ? "Encrypted" : "Not Encrypted"
        }, ${participantCount} of ${maxParticipants} participants`}
    >
      <div
        className="flex items-center gap-2"
        title={status.label}
      >
        <div className="relative flex items-center justify-center">
          <span
            className={`h-2.5 w-2.5 rounded-full ${status.color} ${status.animate}`}
          />
          {connectionStatus === "connecting" && (
            <span className="absolute h-2.5 w-2.5 rounded-full bg-amber-400/50 animate-ping" />
          )}
        </div>
      </div>

      <div className="h-4 w-[1px] bg-border" aria-hidden="true" />

      <div
        className={`flex items-center gap-1.5 transition-colors ${isE2EE ? "text-accent" : "text-muted-foreground"
          }`}
        title={isE2EE ? "End-to-End Encrypted" : "Encryption Disabled"}
      >
        {isE2EE ? (
          <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <Unlock className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
        <span className="hidden text-[10px] uppercase tracking-wider font-bold opacity-80 sm:inline-block">
          {isE2EE ? "E2EE" : "Unsecure"}
        </span>
      </div>

      <div className="h-4 w-[1px] bg-border" aria-hidden="true" />

      <div
        className="flex items-center gap-1.5 text-muted-foreground"
        title="Participants"
      >
        <Users className="h-3.5 w-3.5" />
        <span className="font-mono text-xs tabular-nums tracking-tight">
          {participantCount}/{maxParticipants}
        </span>
      </div>
    </div>
  );
}
