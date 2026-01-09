"use client";

import { useEffect, useState, useCallback } from "react";
import { useRealtime } from "@upstash/realtime/client";

import { getUser } from "@/lib/user";
import type { RealtimeSchema } from "@/lib/realtime";
import type { Message, User } from "@/types";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  user: User | null;
  sendMessage: (text: string) => Promise<void>;
  isSending: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { status } = useRealtime<RealtimeSchema, "chat.message">({
    channels: ["global"],
    events: ["chat.message"] as const,
    onData: (event) => {
      if (event.event === "chat.message") {
        const messageData = event.data as Message;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === messageData.id);
          if (exists) return prev;
          return [...prev, messageData].sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    },
  });

  const isConnected = status === "connected";

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/messages");
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Failed to fetch message history:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || isSending) return;

      const message: Message = {
        id: crypto.randomUUID(),
        text: text.trim(),
        userId: user.id,
        timestamp: Date.now(),
      };

      setIsSending(true);
      setMessages((prev) => [...prev, message].sort((a, b) => a.timestamp - b.timestamp));

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [user, isSending]
  );

  return {
    messages,
    isLoading,
    isConnected,
    user,
    sendMessage,
    isSending,
  };
}
