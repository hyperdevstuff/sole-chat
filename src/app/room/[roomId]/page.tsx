"use client";
import { DestructButton } from "@/components/destruct-button";
import { useUsername } from "@/hooks/use-username";
import { api } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { Clipboard, ClipboardCheck, SendIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Page = () => {
  const params = useParams();
  const { username } = useUsername();
  const roomId = params.roomId as string;
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await api.messages.post(
        { sender: username, text },
        { query: { roomId } },
      );
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

  const handleDestroy = () => {
    console.log("room destroyed");
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="relative border-b border-neutral-800 p-4 flex items-center justify-between bg-neutral-900/30">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 uppercase">room id</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">{roomId}</span>
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

        <div className="absolute left-1/2 -translate-x-1/2">
          <DestructButton
            timeRemaining={timeRemaining}
            onDestroy={handleDestroy}
          />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"></div>
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/30 ">
        <div className="flex gap-4 ">
          <div className="flex-1 relative group text-wrap">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse">
              {">"}
            </span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  //TODO: send message
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type Message..."
              type="text"
              className="w-full bg-black border border-neutral-800 focus:border-neutral-700 focus:outline-none transition-colors text-neutral-100 placeholder:text-neutral-700 py-3 pl-8 pr-4 text-sm text-wrap"
            />
          </div>
          <button className="bg-neutral-800 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ">
            <SendIcon width={18}></SendIcon>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
