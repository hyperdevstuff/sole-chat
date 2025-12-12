"use client";
import { api } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import "nanoid";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADJECTIVES = [
  "swift",
  "sweep",
  "totem",
  "crone",
  "voyger",
  "forger",
  "glove",
  "quantum",
  "stealth",
  "shadow",
  "mystic",
  "prism",
  "chrome",
  "nebula",
  "velvet",
  "steel",
];

const STORAGE_KEY = "chat_username";

const generateUsername = () =>
  `anon-${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}-${nanoid(5)}`;

function App() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  useEffect(() => {
    const main = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUsername(stored);
        return;
      }
      const generatedUsername = generateUsername();
      localStorage.setItem(STORAGE_KEY, generatedUsername);
      setUsername(generatedUsername);
    };
    main();
  }, []);

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await api.rooms.create.post();
      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

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
              className="w-full bg-neutral-100 text-black p-3 text-sm font-bold hover:bg-neutral-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50 "
            >
              CREATE SECURE ROOM
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
