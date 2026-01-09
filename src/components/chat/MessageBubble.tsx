import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  userColor: string;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

export function MessageBubble({
  message,
  isOwn,
  userColor,
}: Readonly<MessageBubbleProps>) {
  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: userColor }}
      >
        {message.userId.slice(0, 2).toUpperCase()}
      </div>

      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md"
            : "bg-white/10 backdrop-blur-sm text-white/90 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{message.text}</p>
        <span
          className={`text-[10px] mt-1 block ${
            isOwn ? "text-white/70" : "text-white/50"
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
