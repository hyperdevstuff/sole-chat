import type { User } from "@/types";

const USER_STORAGE_KEY = "sole-chat-user";

const AVATAR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3d9",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#e879f9",
];

function generateId(): string {
  return crypto.randomUUID();
}

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function getUser(): User {
  if (typeof window === "undefined") {
    return { id: "server", color: AVATAR_COLORS[0] };
  }

  const stored = localStorage.getItem(USER_STORAGE_KEY);

  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  const user: User = {
    id: generateId(),
    color: getRandomColor(),
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getUserId(): string {
  return getUser().id;
}

export function getUserColor(): string {
  return getUser().color;
}
