"use client";
import "nanoid";
import { nanoid } from "nanoid";

const adjectives = [
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

const generateUserId = () =>
  `anon_${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nanoid(8)}`;

function App() {}

export default App;
