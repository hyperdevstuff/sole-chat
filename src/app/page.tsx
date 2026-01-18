"use client";
import { useState } from "react";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/client";
import { generateKeyPair, exportPublicKey, storePrivateKey } from "@/lib/crypto";
import { ROOM_TYPE_CONFIG, ROOM_TTL_OPTIONS, ROOM_TTL_LABELS, type RoomType, type RoomTTLKey } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import "nanoid";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Users, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  const { username } = useUsername();
  const router = useRouter();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("private");
  const [selectedTTL, setSelectedTTL] = useState<RoomTTLKey>("10m");

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      let publicKey: string | undefined;
      let privateKey: CryptoKey | undefined;
      
      if (roomType === "private") {
        const keyPair = await generateKeyPair();
        publicKey = await exportPublicKey(keyPair.publicKey);
        privateKey = keyPair.privateKey;
      }
      
      const res = await api.rooms.create.post({ 
        publicKey, 
        type: roomType,
        ttl: ROOM_TTL_OPTIONS[selectedTTL]
      });
      if (res.status === 200 && res.data?.roomId) {
        const newRoomId = res.data.roomId;
        
        if (privateKey) {
          storePrivateKey(newRoomId, privateKey);
        }
        
        const roomUrl = `${window.location.origin}/room/${newRoomId}`;
        
        await navigator.clipboard.writeText(roomUrl);
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
    <main className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            private_chat
          </h1>
          <p className="text-muted text-sm">
            E2E chat with self-destructing abilities.
          </p>
        </div>
        <div className="border border-border bg-surface/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-muted">
                Room Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["private", "group"] as const).map((type) => {
                  const config = ROOM_TYPE_CONFIG[type];
                  const isSelected = roomType === type;
                  const Icon = type === "private" ? Lock : Users;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`flex flex-col items-center gap-2 p-4 border transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-500/10"
                          : "border-border bg-surface-sunken hover:border-border-strong"
                      }`}
                    >
                      <Icon size={20} className={isSelected ? "text-green-500" : "text-muted"} />
                      <span className={`text-sm font-bold ${isSelected ? "text-green-500" : "text-foreground"}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-muted text-center">
                        {config.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-muted">
                <Clock size={14} className="mr-2" />
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ROOM_TTL_OPTIONS) as RoomTTLKey[]).map((key) => {
                  const isSelected = selectedTTL === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTTL(key)}
                      className={`flex items-center justify-center p-3 border transition-all text-sm font-bold ${
                        isSelected
                          ? "border-green-500 bg-green-500/10 text-green-500"
                          : "border-border bg-surface-sunken hover:border-border-strong text-foreground"
                      }`}
                    >
                      {ROOM_TTL_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-muted ">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-surface-sunken border border-border p-3 text-sm text-muted font-bold">
                  {username}
                </div>
              </div>
            </div>
            <Button
              onClick={() => createRoom()}
              disabled={isPending}
              aria-label="Create a new secure chat room"
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background p-3 text-sm font-bold hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-none h-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CREATING...
                </>
              ) : roomType === "private" ? (
                <>
                  <Lock size={14} />
                  CREATE PRIVATE ROOM
                </>
              ) : (
                <>
                  <Users size={14} />
                  CREATE GROUP ROOM
                </>
              )}
            </Button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted">
                or join existing
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Paste Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="flex-1 bg-surface-sunken border border-border p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-green-500/50 transition-colors font-mono rounded-none h-auto focus-visible:ring-0 shadow-none"
                />
                <Button
                  variant="ghost"
                  onClick={handleJoin}
                  disabled={!roomId.trim()}
                  aria-label="Join existing room"
                  className="px-6 border border-border bg-transparent text-green-500 text-sm font-bold hover:bg-green-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-none h-auto"
                >
                  JOIN
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
