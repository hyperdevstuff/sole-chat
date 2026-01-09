"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  isSending,
  disabled = false,
}: Readonly<MessageInputProps>) {
  const [text, setText] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending || disabled) return;

    const message = text;
    setText("");
    await onSend(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm"
    >
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isSending || disabled}
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isSending ? (
            <svg
              className="w-5 h-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </form>
  );
}
