"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/hooks/useChat";

export function ChatWindow() {
  const { messages, isLoading, isConnected, user, sendMessage, isSending } =
    useChat();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <header className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">sole-chat</h1>
            <p className="text-sm text-white/50">Anonymous chat room</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="text-sm text-white/50">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      <MessageList messages={messages} user={user} isLoading={isLoading} />

      <MessageInput
        onSend={sendMessage}
        isSending={isSending}
        disabled={!isConnected}
      />
    </div>
  );
}
