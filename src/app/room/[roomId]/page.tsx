"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DestructButton } from "@/components/destruct-button";
import { DestructModal } from "@/components/destruct-modal";
import { ExpiredModal } from "@/components/expired-modal";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import { useE2EE } from "@/hooks/use-e2ee";
import { api } from "@/lib/client";
import {
  TYPING_TIMEOUT_MS,
  COPY_FEEDBACK_MS,
  WARNING_THRESHOLD_60S,
  WARNING_THRESHOLD_10S,
} from "@/lib/constants";
import { useRealtime } from "@/lib/realtime-client";
import type { Message } from "@/lib/realtime";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, ClipboardCheck, LogOut, SendIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const MessageSkeleton = () => (
  <div className="w-full space-y-4 py-2">
    <div className="flex flex-col items-start animate-pulse">
      <div className="h-3 w-16 bg-surface-elevated rounded mb-1 opacity-50" />
      <div className="h-10 w-48 bg-surface-elevated/50 rounded-lg rounded-tl-none" />
    </div>
    <div className="flex flex-col items-end animate-pulse">
      <div className="h-3 w-16 bg-surface-elevated rounded mb-1 opacity-50" />
      <div className="h-12 w-64 bg-surface-elevated/30 rounded-lg rounded-tr-none" />
    </div>
    <div className="flex flex-col items-start animate-pulse">
      <div className="h-3 w-20 bg-surface-elevated rounded mb-1 opacity-50" />
      <div className="h-14 w-56 bg-surface-elevated/50 rounded-lg rounded-tl-none" />
    </div>
    <div className="flex flex-col items-end animate-pulse">
      <div className="h-3 w-14 bg-surface-elevated rounded mb-1 opacity-50" />
      <div className="h-10 w-40 bg-surface-elevated/30 rounded-lg rounded-tr-none" />
    </div>
  </div>
);

const formatRelativeTime = (timestamp: number, now: number) => {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const TypingIndicator = ({ username }: { username: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xs text-muted italic">{username} is typing</span>
    <div className="flex items-center gap-1 bg-surface-elevated/30 rounded-full px-2 py-1 h-5">
      <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-duration:1s]" style={{ animationDelay: '0s' }} />
      <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-duration:1s]" style={{ animationDelay: '0.15s' }} />
      <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-duration:1s]" style={{ animationDelay: '0.3s' }} />
    </div>
  </div>
);

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const { username } = useUsername();
  const { toast } = useToast();
  const roomId = params.roomId as string;
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [now, setNow] = useState(Date.now());
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [systemMessages, setSystemMessages] = useState<{ id: string; text: string; timestamp: number }[]>([]);
  const [warned60, setWarned60] = useState(false);
  const [warned10, setWarned10] = useState(false);
  const [showDestructModal, setShowDestructModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const keepAliveInProgressRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasEmittedJoin = useRef(false);
  const hasConnectedBefore = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});

  const { status: e2eeStatus, encryptMessage, decryptMessage, handleKeyExchange } = useE2EE({
    roomId,
    username,
  });

  // Fetch initial message history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await api.messages.get({ query: { roomId } });
      if (res.error) throw res.error;
      return res.data as { messages: Message[]; ttl: number };
    },
    staleTime: Infinity,
    retry: 2,
    meta: {
      onError: () => toast({ message: "Failed to load message history.", type: "error" }),
    },
  });

  const historyMessages = historyData?.messages ?? [];

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const SCROLL_THRESHOLD_PX = 50;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD_PX;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    setIsAtBottom(true);
  }, []);

  const { mutate: keepAlive } = useMutation({
    mutationFn: async () => {
      const res = await api.rooms({ roomId }).patch({ query: { roomId } });
      if (res.error) throw res.error;
      return res.data as { success: boolean; ttl: number; message: string; error?: string };
    },
    onSuccess: (data) => {
      keepAliveInProgressRef.current = false;
      if (data.success) {
        setTimeRemaining(data.ttl);
        setWarned60(false);
        setWarned10(false);
        toast({ message: data.message, type: "success" });
      } else {
        toast({ message: data.message, type: "error" });
      }
    },
    onError: () => {
      keepAliveInProgressRef.current = false;
      toast({ message: "Failed to extend room.", type: "error" });
    },
  });

  const handleKeepAlive = useCallback(() => {
    if (keepAliveInProgressRef.current) return;
    keepAliveInProgressRef.current = true;
    keepAlive();
  }, [keepAlive]);

  // Initialize timeRemaining from TTL
  useEffect(() => {
    if (historyData?.ttl !== undefined && timeRemaining === null) {
      setTimeRemaining(historyData.ttl);
    }
  }, [historyData?.ttl, timeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) {
      setShowExpiredModal(true);
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Warning toasts
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= WARNING_THRESHOLD_60S && timeRemaining > WARNING_THRESHOLD_10S && !warned60) {
      setWarned60(true);
      toast({
        message: "Room expires in 1 minute",
        duration: 30000,
        type: "warning",
        action: { label: "Keep Alive", onClick: handleKeepAlive },
      });
    }
    if (timeRemaining <= WARNING_THRESHOLD_10S && !warned10) {
      setWarned10(true);
      toast({
        message: "Room expires in 10 seconds!",
        duration: 15000,
        type: "error",
        action: { label: "Keep Alive", onClick: handleKeepAlive },
      });
    }
  }, [timeRemaining, warned60, warned10, toast, handleKeepAlive]);

  // Merge history with realtime messages (deduplicated by id)
  const messages = [...historyMessages, ...realtimeMessages].filter(
    (msg, idx, arr) => arr.findIndex((m) => m.id === msg.id) === idx
  );

  const handleRealtimeData = useCallback(
    async (payload: {
      event: "chat.message" | "chat.destroy" | "chat.typing" | "chat.join" | "chat.leave" | "chat.keyExchange";
      data: Message | { isDestroyed: true } | { sender: string; isTyping: boolean } | { username: string; timestamp: number } | { publicKey: string; username: string };
      channel: string;
    }) => {
      if (payload.event === "chat.message") {
        const newMessage = payload.data as Message;
        setRealtimeMessages((prev) => [...prev, newMessage]);
        if (e2eeStatus === "ready") {
          const decrypted = await decryptMessage(newMessage.text);
          setDecryptedMessages((prev) => ({ ...prev, [newMessage.id]: decrypted }));
        }
        if (!isAtBottom && newMessage.sender !== username) {
          setUnreadCount((prev) => prev + 1);
        }
      } else if (payload.event === "chat.keyExchange") {
        const keyData = payload.data as { publicKey: string; username: string };
        if (keyData.username !== username) {
          handleKeyExchange(keyData.publicKey);
          toast({ message: "Secure connection established.", type: "success" });
        }
      } else if (payload.event === "chat.destroy") {
        router.push("/");
      } else if (payload.event === "chat.typing") {
        const typingData = payload.data as { sender: string; isTyping: boolean };
        if (typingData.sender !== username) {
          setTypingUser(typingData.isTyping ? typingData.sender : null);
        }
      } else if (payload.event === "chat.join") {
        const joinData = payload.data as { username: string; timestamp: number };
        if (joinData.username !== username) {
          setSystemMessages((prev) => {
            // Dedupe: don't add "X joined" if already present for this username
            const alreadyJoined = prev.some((msg) => msg.text === `${joinData.username} joined`);
            if (alreadyJoined) return prev;
            return [
              ...prev,
              { id: `join-${joinData.timestamp}`, text: `${joinData.username} joined`, timestamp: joinData.timestamp },
            ];
          });
        }
      } else if (payload.event === "chat.leave") {
        const leaveData = payload.data as { username: string; timestamp: number };
        if (leaveData.username !== username) {
          setSystemMessages((prev) => [
            ...prev,
            { id: `leave-${leaveData.timestamp}`, text: `${leaveData.username} left`, timestamp: leaveData.timestamp },
          ]);
        }
      }
    },
    [router, username, isAtBottom, e2eeStatus, decryptMessage, handleKeyExchange, toast],
  );

  const { status } = useRealtime({
    channels: [`chat:${roomId}`],
    events: ["chat.message", "chat.destroy", "chat.typing", "chat.join", "chat.leave", "chat.keyExchange"],
    onData: handleRealtimeData,
  });

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev === null) return;

    if (prev === "connecting" && status === "connected") {
      if (hasConnectedBefore.current) {
        toast({ message: "Reconnected to chat.", type: "success" });
        if (username) {
          fetch("/api/realtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: `chat:${roomId}`,
              event: "chat.join",
              data: { username, timestamp: Date.now() },
            }),
          }).catch((err) => {
            console.warn("Failed to re-emit join on reconnection:", err);
          });
        }
      }
      hasConnectedBefore.current = true;
    } else if (prev === "connected" && status === "connecting") {
      toast({ message: "Connection lost. Reconnecting...", type: "warning" });
    } else if (status === "error") {
      toast({ message: "Connection failed. Please refresh the page.", type: "error" });
    }
  }, [status, toast, username, roomId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, systemMessages, isAtBottom]);

  useEffect(() => {
    if (e2eeStatus !== "ready" || messages.length === 0) return;
    const decryptAll = async () => {
      const newDecrypted: Record<string, string> = {};
      for (const msg of messages) {
        if (!decryptedMessages[msg.id]) {
          newDecrypted[msg.id] = await decryptMessage(msg.text);
        }
      }
      if (Object.keys(newDecrypted).length > 0) {
        setDecryptedMessages((prev) => ({ ...prev, ...newDecrypted }));
      }
    };
    decryptAll();
  }, [e2eeStatus, messages, decryptMessage, decryptedMessages]);

  useEffect(() => {
    if (hasEmittedJoin.current || !username) return;
    hasEmittedJoin.current = true;

    fetch("/api/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: `chat:${roomId}`,
        event: "chat.join",
        data: { username, timestamp: Date.now() },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Join emit failed");
      })
      .catch(() => {
        toast({ message: "Failed to announce your presence.", type: "error" });
      });
  }, [roomId, username, toast]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!username) return;
      navigator.sendBeacon(
        `/api/rooms/${roomId}/leave?roomId=${roomId}`,
        JSON.stringify({ username }),
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomId, username]);

  const emitTyping = useCallback(
    async (isTyping: boolean) => {
      try {
        const res = await fetch("/api/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: `chat:${roomId}`,
            event: "chat.typing",
            data: { sender: username, isTyping },
          }),
        });
        if (!res.ok) throw new Error("Typing emit failed");
      } catch {
        // Only show toast for typing=true (start typing) to avoid spam
        // Silently ignore typing=false failures
        if (isTyping) {
          toast({ message: "Connection issue - typing indicator may not be visible.", type: "warning" });
        }
      }
    },
    [roomId, username, toast],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (e.target.value.trim()) {
      emitTyping(true);
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), TYPING_TIMEOUT_MS);
    } else {
      emitTyping(false);
    }
  };

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const encryptedText = e2eeStatus === "ready" ? await encryptMessage(text) : text;
      await api.messages.post(
        { sender: username, text: encryptedText },
        { query: { roomId } },
      );
    },
    onError: () => {
      toast({ message: "Failed to send message. Please try again.", type: "error" });
    },
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch (err) {
      console.error("clipboard fail:", err);
      toast({ message: "Failed to copy link. Try again.", type: "error" });
    }
  };

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await api.rooms({ roomId }).delete({ query: { roomId } });
    },
    onSuccess: () => {
      router.push("/");
    },
    onError: () => {
      toast({ message: "Failed to destroy room.", type: "error" });
    },
  });

  const handleDestroy = () => {
    setShowDestructModal(true);
  };

  const formatExport = useCallback(() => {
    const allItems = [
      ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.timeStamp })),
      ...systemMessages.map(s => ({ type: 'system' as const, data: s, timestamp: s.timestamp })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    const lines = [
      "SOLE-CHAT Export",
      `Room: ${roomId}`,
      `Exported: ${new Date().toISOString()}`,
      "---",
    ];

    for (const item of allItems) {
      const time = new Date(item.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      if (item.type === "system") {
        lines.push(`[${time}] --- ${item.data.text} ---`);
      } else {
        lines.push(`[${time}] ${item.data.sender}: ${item.data.text}`);
      }
    }

    return lines.join("\n");
  }, [messages, systemMessages, roomId]);

  const handleExportAndDestroy = useCallback(() => {
    const content = formatExport();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sole-chat-${roomId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDestructModal(false);
    destroyRoom();
  }, [formatExport, roomId, destroyRoom]);

  const handleJustDestroy = useCallback(() => {
    setShowDestructModal(false);
    destroyRoom();
  }, [destroyRoom]);

  const handleExit = useCallback(async () => {
    if (!username) return;
    await api.rooms({ roomId }).leave.post({ username }, { query: { roomId } });
    router.push("/");
  }, [roomId, username, router]);

  const handleExpiredExport = useCallback(() => {
    const content = formatExport();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sole-chat-${roomId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formatExport, roomId]);

  const handleCreateNew = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <main className="flex flex-col h-svh max-h-svh overflow-hidden">
      <DestructModal
        isOpen={showDestructModal}
        onClose={() => setShowDestructModal(false)}
        onExportAndDestroy={handleExportAndDestroy}
        onJustDestroy={handleJustDestroy}
      />
      <ExpiredModal
        isOpen={showExpiredModal}
        onExport={handleExpiredExport}
        onCreateNew={handleCreateNew}
        onClose={() => setShowExpiredModal(false)}
      />
      <header className="relative border-b border-border p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-0 bg-surface/30">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs text-muted uppercase hidden sm:block">room id</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 truncate">{roomId}</span>
              {status !== "connected" && (
                <span
                  className={`flex items-center gap-1.5 text-[10px] ${status === "error" ? "text-red-400" : "text-yellow-400"
                    }`}
                  title={status === "error" ? "Connection lost" : "Reconnecting..."}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${status === "error" ? "bg-red-400" : "bg-yellow-400 animate-pulse-subtle"
                      }`}
                  />
                  <span className="hidden sm:inline">{status === "error" ? "Disconnected" : "Reconnecting"}</span>
                </span>
              )}
              <Button
                variant="ghost"
                onClick={copyLink}
                aria-label={copied ? "Room link copied to clipboard" : "Copy room link to clipboard"}
                className="flex items-center gap-1.5 text-[10px] bg-surface-elevated hover:bg-surface-elevated/80 px-2 py-2 sm:py-1 h-auto rounded text-muted hover:text-foreground shrink-0"
              >
                {copied ? (
                  <ClipboardCheck size={12} />
                ) : (
                  <Clipboard size={12} />
                )}
                <span className="hidden sm:inline">{copied ? "COPIED" : "COPY"}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <DestructButton
            timeRemaining={timeRemaining}
            onDestroy={handleDestroy}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleExit}
            aria-label="Exit room without destroying"
            className="flex items-center gap-1.5 text-xs border border-border hover:border-border-strong text-muted hover:text-foreground p-2 sm:px-3 sm:py-2 h-auto rounded"
            title="Leave room without destroying"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </header>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin relative"
      >
        {isHistoryLoading ? (
          <MessageSkeleton />
        ) : (
          [...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.timeStamp })),
          ...systemMessages.map(s => ({ type: 'system' as const, data: s, timestamp: s.timestamp }))]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((item) =>
              item.type === 'system' ? (
                <div key={item.data.id} className="flex justify-center animate-fade-in">
                  <span className="text-xs text-muted italic">{item.data.text}</span>
                </div>
              ) : (
                <div
                  key={item.data.id}
                  className={`flex flex-col ${item.data.sender === username ? "items-end" : "items-start"}`}
                >
                  <span className="text-xs text-muted mb-1">
                    {item.data.sender}
                  </span>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-lg text-sm ${item.data.sender === username
                      ? "bg-green-600/20 text-green-100 border border-green-700/30"
                      : "bg-surface-elevated text-foreground border border-border/30"
                      }`}
                  >
                    {decryptedMessages[item.data.id] ?? item.data.text}
                  </div>
                  <span className="text-xs text-muted mt-1 opacity-75">
                    {formatRelativeTime(item.data.timeStamp, now)}
                  </span>
                </div>
              )
            )
        )}
        {typingUser && (
          <TypingIndicator username={typingUser} />
        )}
        <div ref={messagesEndRef} />
        {unreadCount > 0 && !isAtBottom && (
          <Button
            onClick={scrollToBottom}
            aria-label={`${unreadCount} new message${unreadCount > 1 ? "s" : ""} - click to scroll down`}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 h-auto rounded-full shadow-lg animate-fade-in flex items-center gap-2"
          >
            <span>{unreadCount} new message{unreadCount > 1 ? "s" : ""}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        )}
      </div>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-surface/30">
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 relative group text-wrap">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse">
              {">"}
            </span>
            <Input
              aria-label="Message input"
              value={input}
              onChange={handleInputChange}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                  emitTyping(false);
                  inputRef.current?.focus();
                }
              }}
              placeholder={showExpiredModal ? "Room expired" : "Type Message..."}
              type="text"
              disabled={showExpiredModal}
              className="w-full bg-surface-sunken border border-border focus:border-border-strong py-3 pl-8 pr-4 text-base h-auto rounded-none focus-visible:ring-0 shadow-none"
            />
          </div>
          <Button
            variant="secondary"
            aria-label="Send message"
            onClick={() => {
              if (input.trim()) {
                sendMessage({ text: input });
                setInput("");
                emitTyping(false);
              }
            }}
            disabled={!input.trim() || showExpiredModal}
            className="bg-surface-elevated px-6 min-h-[44px] min-w-[44px] h-auto rounded-none"
          >
            <SendIcon width={18}></SendIcon>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Page;
