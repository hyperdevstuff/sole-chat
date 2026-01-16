"use client";
import { useState } from "react";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import "nanoid";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <main className="flex min-h-svh flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-accent">
            private_chat
          </h1>
          <p className="text-muted text-sm">
            E2E chat with self-destructing ablities.
          </p>
        </div>
        <div className="border border-border bg-surface/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-muted">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-surface-sunken border border-border p-3 text-sm text-muted font-bold">
                  {username}
                </div>
              </div>
            </div>
            <button
              onClick={() => createRoom()}
              disabled={isPending}
              aria-label="Create a new secure chat room"
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background p-3 text-sm font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">
                or join existing
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="flex-1 bg-surface-sunken border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={!roomId.trim()}
                  aria-label="Join existing room"
                  className="px-6 border border-border bg-transparent text-accent text-sm font-bold hover:bg-accent/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
