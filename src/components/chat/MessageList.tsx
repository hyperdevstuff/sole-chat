"use client";

import { useEffect, useRef } from "react";

import { MessageBubble } from "./MessageBubble";
import type { Message, User } from "@/types";

interface MessageListProps {
  messages: Message[];
  user: User | null;
  isLoading: boolean;
}

const AVATAR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3d9",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#e879f9",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function MessageList({
  messages,
  user,
  isLoading,
}: Readonly<MessageListProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/50">
          <p className="text-lg">No messages yet</p>
          <p className="text-sm mt-1">Be the first to say something!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={user?.id === message.userId}
          userColor={
            user?.id === message.userId
              ? user.color
              : getUserColor(message.userId)
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
