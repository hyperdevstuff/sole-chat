"use client";
import { DestructButton } from "@/components/destruct-button";
import { DestructModal } from "@/components/destruct-modal";
import { ExpiredModal } from "@/components/expired-modal";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import type { Message, RealtimeEvents } from "@/lib/realtime";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, ClipboardCheck, LogOut, SendIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Fetch initial message history
  const { data: historyData } = useQuery({
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

  const { mutate: keepAlive } = useMutation({
    mutationFn: async () => {
      const res = await api.rooms({ roomId }).patch();
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
    if (timeRemaining <= 60 && timeRemaining > 10 && !warned60) {
      setWarned60(true);
      toast({ 
        message: "Room expires in 1 minute", 
        type: "warning",
        action: { label: "Keep Alive", onClick: handleKeepAlive },
      });
    }
    if (timeRemaining <= 10 && !warned10) {
      setWarned10(true);
      toast({ 
        message: "Room expires in 10 seconds!", 
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
    (payload: {
      event: "chat.message" | "chat.destroy" | "chat.typing" | "chat.join" | "chat.leave";
      data: Message | { isDestroyed: true } | { sender: string; isTyping: boolean } | { username: string; timestamp: number };
      channel: string;
    }) => {
      if (payload.event === "chat.message") {
        setRealtimeMessages((prev) => [...prev, payload.data as Message]);
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
    [router, username],
  );

  const { status } = useRealtime({
    channels: [`chat:${roomId}`],
    events: ["chat.message", "chat.destroy", "chat.typing", "chat.join", "chat.leave"],
    onData: handleRealtimeData,
  });

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev === null) return;

    if (prev === "connecting" && status === "connected") {
      if (hasEmittedJoin.current) {
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
          }).catch(() => {});
        }
      } else {
        toast({ message: "Connected to chat.", type: "success" });
      }
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, systemMessages]);

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
    const timer = setTimeout(() => setCopied(false), 2000);
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
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
    } else {
      emitTyping(false);
    }
  };

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await api.messages.post(
        { sender: username, text },
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
    }
  };

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await api.rooms({ roomId }).delete();
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
    await api.rooms({ roomId }).leave.post({ username });
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
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
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
      />
      <header className="relative border-b border-neutral-800 p-4 flex items-center justify-between bg-neutral-900/30">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 uppercase">room id</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">{roomId}</span>
              {status !== "connected" && (
                <span
                  className={`flex items-center gap-1.5 text-[10px] ${
                    status === "error" ? "text-red-400" : "text-yellow-400"
                  }`}
                  title={status === "error" ? "Connection lost" : "Reconnecting..."}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === "error" ? "bg-red-400" : "bg-yellow-400 animate-pulse-subtle"
                    }`}
                  />
                  {status === "error" ? "Disconnected" : "Reconnecting"}
                </span>
              )}
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <ClipboardCheck size={12} />
                ) : (
                  <Clipboard size={12} />
                )}
                <span>{copied ? "COPIED" : "COPY"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 text-xs border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 px-3 py-2 rounded transition-colors cursor-pointer"
            title="Leave room without destroying"
          >
            <LogOut size={14} />
            <span>Exit</span>
          </button>
          <DestructButton
            timeRemaining={timeRemaining}
            onDestroy={handleDestroy}
          />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {[...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.timeStamp })),
          ...systemMessages.map(s => ({ type: 'system' as const, data: s, timestamp: s.timestamp }))]
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item) => 
            item.type === 'system' ? (
              <div key={item.data.id} className="flex justify-center animate-fade-in">
                <span className="text-xs text-neutral-500 italic">{item.data.text}</span>
              </div>
            ) : (
              <div
                key={item.data.id}
                className={`flex flex-col ${item.data.sender === username ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-neutral-500 mb-1">
                  {item.data.sender}
                </span>
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                    item.data.sender === username
                      ? "bg-green-600/20 text-green-100 border border-green-700/30"
                      : "bg-neutral-800 text-neutral-100 border border-neutral-700/30"
                  }`}
                >
                  {item.data.text}
                </div>
                <span className="text-xs text-neutral-500 mt-1 opacity-75">
                  {formatRelativeTime(item.data.timeStamp, now)}
                </span>
              </div>
            )
          )}
        {typingUser && (
          <div className="flex items-start">
            <span className="text-xs text-neutral-500 italic animate-pulse">
              {typingUser} is typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/30 ">
        <div className="flex gap-4 ">
          <div className="flex-1 relative group text-wrap">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse">
              {">"}
            </span>
            <input
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
              className="w-full bg-black border border-neutral-800 focus:border-neutral-700 focus:outline-none transition-colors text-neutral-100 placeholder:text-neutral-700 py-3 pl-8 pr-4 text-sm text-wrap disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={() => {
              if (input.trim()) {
                sendMessage({ text: input });
                setInput("");
                emitTyping(false);
              }
            }}
            disabled={!input.trim() || showExpiredModal}
            className="bg-neutral-800 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer "
          >
            <SendIcon width={18}></SendIcon>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
