"use client";
import { useState } from "react";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import "nanoid";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function App() {
  const { username } = useUsername();
  const router = useRouter();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState("");

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.rooms.create.post();
      if (res.status === 200 && res.data?.roomId) {
        const newRoomId = res.data.roomId;
        const roomUrl = `${window.location.origin}/room/${newRoomId}`;
        
        await navigator.clipboard.writeText(roomUrl);
        toast({ 
          message: "Room created! Link copied to clipboard.", 
          type: "success" 
        });
        
        router.push(`/room/${newRoomId}`);
      }
    },
    onError: () => {
      toast({ message: "Failed to create room. Try again.", type: "error" });
    },
  });

  const handleJoin = () => {
    if (!roomId.trim()) return;
    // Extract room ID from URL if user pastes full URL
    let id = roomId.trim();
    try {
      const url = new URL(id);
      const match = url.pathname.match(/\/room\/([^/]+)/);
      if (match) id = match[1];
    } catch {
      // Not a URL, use as-is
    }
    router.push(`/room/${id}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            private_chat
          </h1>
          <p className="text-neutral-500 text-sm">
            E2E chat with self-destructing ablities.
          </p>
        </div>
        <div className="border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-neutral-500 ">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-neutral-950 border border-neutral-800 p-3 text-sm text-neutral-400 font-bold">
                  {username}
                </div>
              </div>
            </div>
            <button
              onClick={() => createRoom()}
              disabled={isPending}
              aria-label="Create a new secure chat room"
              className="w-full flex items-center justify-center gap-2 bg-neutral-100 text-black p-3 text-sm font-bold hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CREATING...
                </>
              ) : (
                "CREATE SECURE ROOM"
              )}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-neutral-800" />
              <span className="text-xs uppercase text-neutral-600">
                or join existing
              </span>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="flex-1 bg-neutral-950 border border-neutral-800 p-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={!roomId.trim()}
                  aria-label="Join existing room"
                  className="px-6 border border-neutral-800 bg-transparent text-green-500 text-sm font-bold hover:bg-green-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
