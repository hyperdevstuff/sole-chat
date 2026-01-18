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
import { Loader2, Lock, Users, Clock, Terminal, Shield, ArrowRight, Zap } from "lucide-react";
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
    <main className="flex min-h-svh flex-col items-center justify-center p-4 bg-background text-foreground selection:bg-accent/20 selection:text-accent font-mono relative overflow-hidden">
      
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-[440px] animate-fade-in z-10">
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-sunken border border-border/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">System Online</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-3">
              <span className="text-accent">sole</span>
              <span className="text-border-strong font-light">/</span>
              <span>chat</span>
            </h1>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase max-w-[280px] mx-auto opacity-70">
              Secure Ephemeral Communication Protocol
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border shadow-2xl shadow-black/10 relative group backdrop-blur-sm">
          <div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-accent opacity-50" />
          <div className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 border-accent opacity-50" />
          <div className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 border-accent opacity-50" />
          <div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-accent opacity-50" />

          <div className="bg-surface-sunken border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-surface-elevated border border-border flex items-center justify-center text-accent shadow-sm">
                <Terminal size={16} />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold leading-none mb-1">Identity</span>
                <span className="text-xs font-bold text-foreground leading-none">{username}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-surface-elevated border border-border">
              <Shield size={10} className="text-accent" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Encrypted</span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                  <span className="w-1 h-1 bg-accent rounded-full"></span>
                  Connection Type
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {(["private", "group"] as const).map((type) => {
                  const config = ROOM_TYPE_CONFIG[type];
                  const isSelected = roomType === type;
                  const Icon = type === "private" ? Lock : Users;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`relative flex flex-col items-start gap-2 p-3 border transition-all duration-200 group/btn ${
                        isSelected
                          ? "border-accent bg-accent/5 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.1)]"
                          : "border-border bg-surface-elevated hover:border-accent/50 hover:bg-surface-sunken"
                      }`}
                    >
                      <div className={`p-1.5 rounded-none ${isSelected ? "bg-accent text-accent-foreground" : "bg-surface-sunken text-muted-foreground group-hover/btn:text-foreground"}`}>
                        <Icon size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`block text-xs font-bold uppercase tracking-wider ${isSelected ? "text-accent" : "text-foreground"}`}>
                          {config.label}
                        </span>
                        <span className="block text-[10px] text-muted-foreground font-medium">
                          {config.description}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <span className="w-1 h-1 bg-muted rounded-full"></span>
                Auto-Destruct Timer
              </label>
              <div className="flex border border-border bg-surface-elevated divide-x divide-border">
                {(Object.keys(ROOM_TTL_OPTIONS) as RoomTTLKey[]).map((key) => {
                  const isSelected = selectedTTL === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTTL(key)}
                      className={`flex-1 py-3 text-xs font-bold transition-all duration-200 relative ${
                        isSelected
                          ? "text-accent bg-accent/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-sunken"
                      }`}
                    >
                      {ROOM_TTL_LABELS[key]}
                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => createRoom()}
              disabled={isPending}
              aria-label="Create a new secure chat room"
              className="w-full h-14 rounded-none bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed group/create relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover/create:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-3">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Zap size={16} className={roomType === 'private' ? 'fill-current' : ''} />
                    <span>Initialize Room</span>
                    <ArrowRight size={16} className="group-hover/create:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </Button>
          </div>

          <div className="bg-surface-sunken border-t border-border p-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <span className="w-1 h-1 bg-muted rounded-full"></span>
                Join Existing Frequency
              </label>
              <div className="flex gap-0 shadow-sm">
                <Input
                  type="text"
                  placeholder="ENTER ROOM ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="flex-1 bg-surface border border-r-0 border-border p-3 text-sm font-mono placeholder:text-muted focus-visible:ring-0 focus:border-accent focus:z-10 rounded-none h-10 transition-colors uppercase"
                />
                <Button
                  variant="secondary"
                  onClick={handleJoin}
                  disabled={!roomId.trim()}
                  className="px-6 border border-border border-l-0 rounded-none h-10 bg-surface-elevated hover:bg-surface hover:text-accent disabled:opacity-50 font-bold tracking-wider text-xs uppercase"
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono uppercase tracking-widest opacity-60">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Node Active</span>
          </div>
          <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest opacity-60">
            <span>E2EE • AES-GCM-256</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
