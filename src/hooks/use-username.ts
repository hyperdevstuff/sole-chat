import { nanoid } from "nanoid";
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

export const useUsername = () => {
  const [username, setUsername] = useState("");
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
  return { username };
};
